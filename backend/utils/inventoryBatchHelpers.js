import mongoose from "mongoose";

const QUANTITY_PRECISION = 4;
const MONEY_PRECISION = 2;

const roundValue = (value, precision) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  const multiplier = 10 ** precision;
  return Math.round((numericValue + Number.EPSILON) * multiplier) / multiplier;
};

export const normalizeQuantity = (value, fallback = 0) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return Math.max(0, roundValue(fallback, QUANTITY_PRECISION));
  }
  return Math.max(0, roundValue(numericValue, QUANTITY_PRECISION));
};

export const normalizeMoney = (value, fallback = 0) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return Math.max(0, roundValue(fallback, MONEY_PRECISION));
  }
  return Math.max(0, roundValue(numericValue, MONEY_PRECISION));
};

export const normalizeUnit = (unit) => String(unit ?? "").trim().toLowerCase();

const resolveDate = (value, fallback = new Date()) => {
  const dateValue = value ? new Date(value) : new Date(fallback);
  if (Number.isNaN(dateValue.getTime())) {
    return new Date(fallback);
  }
  return dateValue;
};

export const buildBatchCode = (inventory, sequence = 1) => {
  const prefix = String(inventory?.sku || "INV")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12) || "INV";

  return `${prefix}-B${String(sequence).padStart(3, "0")}`;
};

const sortBatchesOldestFirst = (batches = []) =>
  [...batches].sort((left, right) => {
    const leftTime = resolveDate(left?.receivedAt ?? left?.createdAt ?? 0, 0).getTime();
    const rightTime = resolveDate(right?.receivedAt ?? right?.createdAt ?? 0, 0).getTime();

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return (Number(left?.sequence) || 0) - (Number(right?.sequence) || 0);
  });

const toPersistableBatch = (batch, inventory, fallbackSequence = 1) => {
  const sequence = Math.max(1, Number(batch?.sequence) || fallbackSequence);
  const quantity = normalizeQuantity(batch?.quantity);
  const initialQuantity = normalizeQuantity(batch?.initialQuantity ?? quantity);
  const receivedAt = resolveDate(
    batch?.receivedAt ?? batch?.createdAt ?? inventory?.createdAt ?? inventory?.lastActivityDate ?? new Date()
  );

  return {
    _id: batch?._id || new mongoose.Types.ObjectId(),
    sequence,
    batchCode: String(batch?.batchCode || buildBatchCode(inventory, sequence)).trim(),
    quantity,
    initialQuantity,
    receivedAt,
    unitPrice: normalizeMoney(batch?.unitPrice ?? inventory?.unitPrice),
    supplier: String(batch?.supplier ?? inventory?.supplier ?? "").trim(),
    note: String(batch?.note ?? "").trim(),
    createdAt: resolveDate(batch?.createdAt ?? receivedAt),
  };
};

export const getPersistableBatches = (inventory = {}) => {
  const rawBatches = Array.isArray(inventory?.batches) ? inventory.batches : [];

  if (rawBatches.length === 0) {
    const legacyStock = normalizeQuantity(inventory?.stock);
    if (legacyStock <= 0) {
      return [];
    }

    return [
      toPersistableBatch(
        {
          sequence: 1,
          quantity: legacyStock,
          initialQuantity: legacyStock,
          receivedAt: inventory?.createdAt ?? inventory?.lastActivityDate ?? new Date(),
          unitPrice: inventory?.unitPrice,
          supplier: inventory?.supplier,
          note: "Legacy opening stock",
        },
        inventory,
        1
      ),
    ];
  }

  return sortBatchesOldestFirst(
    rawBatches.map((batch, index) => toPersistableBatch(batch, inventory, index + 1))
  ).filter((batch) => batch.quantity > 0);
};

export const getInventoryBatchSummary = (inventory = {}) => {
  const batches = getPersistableBatches(inventory);
  const stock = normalizeQuantity(
    batches.reduce((sum, batch) => sum + normalizeQuantity(batch.quantity), 0)
  );
  const currentStockValue = normalizeMoney(
    batches.reduce((sum, batch) => sum + normalizeQuantity(batch.quantity) * normalizeMoney(batch.unitPrice), 0)
  );
  const averageUnitPrice =
    stock > 0 ? normalizeMoney(currentStockValue / stock) : 0;

  return {
    batches,
    batchCount: batches.length,
    stock,
    currentStockValue,
    averageUnitPrice,
    oldestBatch: batches[0] || null,
    newestBatch: batches[batches.length - 1] || null,
  };
};

export const ensureBatchState = (inventory) => {
  if (!inventory) {
    return getInventoryBatchSummary();
  }

  const summary = getInventoryBatchSummary(inventory);
  inventory.batches = summary.batches;
  inventory.stock = summary.stock;

  const highestSequence = summary.batches.reduce(
    (maxSequence, batch) => Math.max(maxSequence, Number(batch?.sequence) || 0),
    0
  );

  inventory.nextBatchSequence = Math.max(
    Number(inventory?.nextBatchSequence) || 1,
    highestSequence + 1,
    1
  );

  return summary;
};

export const appendInventoryBatch = (inventory, batchInput = {}) => {
  const quantity = normalizeQuantity(batchInput?.quantity);
  if (!inventory || quantity <= 0) return null;

  ensureBatchState(inventory);

  const nextSequence = Math.max(1, Number(inventory?.nextBatchSequence) || 1);
  const batch = toPersistableBatch(
    {
      sequence: nextSequence,
      batchCode: buildBatchCode(inventory, nextSequence),
      quantity,
      initialQuantity: quantity,
      receivedAt: batchInput?.receivedAt ?? new Date(),
      unitPrice: batchInput?.unitPrice ?? inventory?.unitPrice,
      supplier: batchInput?.supplier ?? inventory?.supplier ?? "",
      note: batchInput?.note ?? "",
    },
    inventory,
    nextSequence
  );

  inventory.batches = sortBatchesOldestFirst([...(inventory.batches || []), batch]);
  inventory.nextBatchSequence = nextSequence + 1;
  inventory.stock = normalizeQuantity((Number(inventory.stock) || 0) + quantity);

  return batch;
};

export const previewFifoDeduction = (inventory, quantity) => {
  const requestedQuantity = normalizeQuantity(quantity);
  const { batches, stock } = getInventoryBatchSummary(inventory);
  let remaining = requestedQuantity;
  const breakdown = [];

  for (const batch of batches) {
    if (remaining <= 0) break;

    const available = normalizeQuantity(batch.quantity);
    const willUse = normalizeQuantity(Math.min(available, remaining));
    if (willUse <= 0) continue;

    breakdown.push({
      batchId: batch._id?.toString?.() || String(batch._id),
      batchCode: batch.batchCode,
      sequence: batch.sequence,
      available,
      willUse,
      receivedAt: resolveDate(batch.receivedAt).toISOString(),
      unitPrice: normalizeMoney(batch.unitPrice),
      lineCost: normalizeMoney(willUse * normalizeMoney(batch.unitPrice)),
    });

    remaining = normalizeQuantity(remaining - willUse);
  }

  const totalCost = normalizeMoney(
    breakdown.reduce((sum, entry) => sum + normalizeMoney(entry.lineCost), 0)
  );

  return {
    requestedQuantity,
    availableStock: stock,
    breakdown,
    canFulfill: remaining <= 0,
    shortfall: remaining > 0 ? remaining : 0,
    totalCost,
    averageCost:
      requestedQuantity > 0 ? normalizeMoney(totalCost / requestedQuantity) : 0,
  };
};

export const applyFifoDeduction = (inventory, quantity) => {
  const preview = previewFifoDeduction(inventory, quantity);
  if (!preview.canFulfill) {
    return { success: false, ...preview };
  }

  ensureBatchState(inventory);

  let remaining = preview.requestedQuantity;
  inventory.batches = sortBatchesOldestFirst(inventory.batches || [])
    .map((batch) => {
      if (remaining <= 0) return batch;

      const available = normalizeQuantity(batch.quantity);
      const willUse = normalizeQuantity(Math.min(available, remaining));
      if (willUse <= 0) return batch;

      remaining = normalizeQuantity(remaining - willUse);

      return {
        ...batch,
        quantity: normalizeQuantity(available - willUse),
      };
    })
    .filter((batch) => normalizeQuantity(batch.quantity) > 0);

  inventory.stock = normalizeQuantity(
    inventory.batches.reduce((sum, batch) => sum + normalizeQuantity(batch.quantity), 0)
  );

  const highestSequence = inventory.batches.reduce(
    (maxSequence, batch) => Math.max(maxSequence, Number(batch?.sequence) || 0),
    0
  );

  inventory.nextBatchSequence = Math.max(
    Number(inventory?.nextBatchSequence) || 1,
    highestSequence + 1,
    1
  );

  return {
    success: true,
    ...preview,
  };
};

export const serializeBatch = (batch) => ({
  id: batch?._id?.toString?.() || String(batch?._id || ""),
  batchId: batch?._id?.toString?.() || String(batch?._id || ""),
  batchCode: batch?.batchCode || "",
  sequence: Number(batch?.sequence) || 0,
  quantity: normalizeQuantity(batch?.quantity),
  initialQuantity: normalizeQuantity(batch?.initialQuantity ?? batch?.quantity),
  receivedAt: resolveDate(batch?.receivedAt ?? batch?.createdAt ?? new Date()).toISOString(),
  unitPrice: normalizeMoney(batch?.unitPrice),
  supplier: String(batch?.supplier ?? "").trim(),
  note: String(batch?.note ?? "").trim(),
});
