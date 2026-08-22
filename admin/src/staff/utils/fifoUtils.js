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

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Kuhanin ang lahat ng batches ng isang item, sorted oldest-first.
 * TODO (BACKEND): Palitan ng GET /api/inventory/:id/batches?sort=asc
 */
export function getBatches(itemId) {
  // PARA SA FIFO YAN — pinaka-matanda ang una (oldest first)
  const batches = _readBatches(itemId);
  return [...batches].sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
}

/**
 * Dagdag ng bagong batch kapag may nag-add ng stock.
 * HINDI pinagsasama sa lumang batch — bagong batch ito!
 * TODO (BACKEND): Palitan ng POST /api/inventory/:id/batches
 */
export function addBatch(itemId, quantity) {
  // PARA SA FIFO YAN — bawat dagdag ng stock = bagong batch
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

/**
 * I-preview ang kung paano maa-affect ng deduction ang batches — WALANG pagbabago sa actual data.
 * Ginagamit ito sa modal para ipakita sa user ang batch breakdown bago mag-confirm.
 * TODO (BACKEND): Palitan ng GET /api/inventory/:id/fifo-preview?quantity=X
 */
export function previewFIFO(itemId, quantity) {
  // PARA SA FIFO YAN — preview lang, walang actual na pagbabago
  const batches = getBatches(itemId); // oldest first na ito
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

/**
 * I-deduct ang stock gamit ang FIFO order — pinaka-matanda ang mababawasan muna.
 * TODO (BACKEND): Palitan ng PATCH /api/inventory/:id/fifo-deduct { quantity: X }
 *                 ang backend ang bahala sa pagbabago ng batches sa DB
 */
export function deductFIFO(itemId, quantity) {
  // PARA SA FIFO YAN — dito nangyayari ang actual na deduction, oldest batch muna
  const batches = _readBatches(itemId);
  // I-sort oldest first para sa tamang FIFO order
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
    // Hindi sapat ang stock — huwag ituloy ang deduction
    // TODO (BACKEND): Ipadala ito bilang 400 Bad Request sa backend
    console.warn("FIFO: Hindi sapat ang stock para sa deduction");
    return { success: false, breakdown: [], shortfall: remaining };
  }

  // Tanggalin ang mga empty na batches (quantity === 0)
  const cleaned = updated.filter(b => b.quantity > 0);
  _writeBatches(itemId, cleaned);

  return { success: true, breakdown, shortfall: 0 };
}

/**
 * Kunin ang total na available stock ng isang item batay sa FIFO batches.
 * TODO (BACKEND): Palitan ng GET /api/inventory/:id/total-stock
 */
export function getTotalStock(itemId) {
  // PARA SA FIFO YAN — sum ng lahat ng batch quantities
  const batches = _readBatches(itemId);
  return batches.reduce((sum, b) => sum + b.quantity, 0);
}

/**
 * I-initialize ang batches para sa isang item kung wala pa itong batches.
 * Ginagamit ito sa unang pagkakataon para ma-seed ang mock data.
 * TODO (BACKEND): Huwag na itong kailanin — ang backend na ang magma-manage ng batches
 */
export function initBatchesIfEmpty(itemId, currentStock) {
  // PARA SA FIFO YAN — pansamantala lang ito habang walang backend batch support
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
