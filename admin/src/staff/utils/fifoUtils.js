const FIFO_KEY_PREFIX = "fifo_batches_";

function _readBatches(itemId) {
  try {
    const raw = localStorage.getItem(FIFO_KEY_PREFIX + itemId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function _writeBatches(itemId, batches) {
  try {
    localStorage.setItem(FIFO_KEY_PREFIX + itemId, JSON.stringify(batches));
  } catch (e) {
    console.error("FIFO error:", e);
  }
}

export function getBatches(itemId) {
  const batches = _readBatches(itemId);
  return [...batches].sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
}

export function addBatch(itemId, quantity) {
  const batches = _readBatches(itemId);
  const newBatchId = batches.length > 0 ? Math.max(...batches.map(b => b.batchId)) + 1 : 1;
  const newBatch = {
    batchId: newBatchId,
    quantity: Number(quantity),
    dateAdded: new Date().toISOString(),
  };
  batches.push(newBatch);
  _writeBatches(itemId, batches);
  return newBatch;
}

export function previewFIFO(itemId, quantity) {
  const batches = getBatches(itemId);
  let remaining = Number(quantity);
  const breakdown = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    breakdown.push({
      batchId: batch.batchId,
      available: batch.quantity,
      willUse: take,
      dateAdded: batch.dateAdded,
    });
    remaining -= take;
  }

  return {
    breakdown,
    canFulfill: remaining <= 0,
    shortfall: remaining > 0 ? remaining : 0,
  };
}

export function deductFIFO(itemId, quantity) {
  const batches = _readBatches(itemId);
  const sorted = [...batches].sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));

  let remaining = Number(quantity);
  const breakdown = [];

  const updated = sorted.map(batch => {
    if (remaining <= 0) return batch;
    const take = Math.min(batch.quantity, remaining);
    breakdown.push({
      batchId: batch.batchId,
      dateAdded: batch.dateAdded,
      willUse: take,
      before: batch.quantity,
      after: batch.quantity - take,
    });
    remaining -= take;
    return { ...batch, quantity: batch.quantity - take };
  });

  if (remaining > 0) {
    console.warn("FIFO: Insufficient stock for deduction");
    return { success: false, breakdown: [], shortfall: remaining };
  }

  const cleaned = updated.filter(b => b.quantity > 0);
  _writeBatches(itemId, cleaned);

  return { success: true, breakdown, shortfall: 0 };
}

export function getTotalStock(itemId) {
  const batches = _readBatches(itemId);
  return batches.reduce((sum, b) => sum + b.quantity, 0);
}

export function initBatchesIfEmpty(itemId, currentStock) {
  const existing = _readBatches(itemId);
  if (existing.length === 0 && currentStock > 0) {
    const initialBatch = {
      batchId: 1,
      quantity: Number(currentStock),
      dateAdded: new Date().toISOString(),
    };
    _writeBatches(itemId, [initialBatch]);
  }
}
