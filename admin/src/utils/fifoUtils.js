// ============================================================
// FIFO BATCH UTILITIES — ADMIN SIDE
// ============================================================
// PARA SA FIFO YAN — lahat ng logic para sa FIFO ay nandito
//
// PAUNAWA SA BACKEND DEV:
// Dito lahat ng batch tracking ay naka-store sa localStorage lang muna.
// Kapag may backend na, palitan mo ang localStorage calls ng API calls.
// Ang structure ng bawat batch ay:
// {
//   batchId: number,       — unique ID ng batch
//   quantity: number,      — gaano karami ang natitira sa batch na ito
//   dateAdded: string,     — ISO date string kung kailan dinagdag
// }
// ============================================================

const FIFO_KEY_PREFIX = "fifo_batches_";

// ─── INTERNAL HELPER ──────────────────────────────────────────────────────────
// Basahin ang batches ng isang item mula sa localStorage.
// TODO (BACKEND): Palitan ito ng GET /api/inventory/:id/batches
function _readBatches(itemId) {
  // PARA SA FIFO YAN — ito ang nagbabasa ng batches
  try {
    const raw = localStorage.getItem(FIFO_KEY_PREFIX + itemId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// I-save ang updated batches pabalik sa localStorage.
// TODO (BACKEND): Palitan ito ng PUT /api/inventory/:id/batches
function _writeBatches(itemId, batches) {
  // PARA SA FIFO YAN — ito ang nagsasave ng batches
  try {
    localStorage.setItem(FIFO_KEY_PREFIX + itemId, JSON.stringify(batches));
  } catch (e) {
    console.error("FIFO: Hindi ma-save ang batches sa localStorage", e);
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
 * TODO (BACKEND): Palitan ng GET /api/inventory/:id/total-stock (o kasama na sa item data)
 */
export function getTotalStock(itemId) {
  // PARA SA FIFO YAN — sum ng lahat ng batch quantities
  const batches = _readBatches(itemId);
  return batches.reduce((sum, b) => sum + b.quantity, 0);
}

/**
 * I-initialize ang batches para sa isang item kung wala pa itong batches.
 * Ginagamit ito sa unang pagkakataon para ma-seed ang existing inventory.
 * TODO (BACKEND): Huwag na itong kailanin — ang backend na ang magma-manage ng batches
 */
export function initBatchesIfEmpty(itemId, currentStock) {
  // PARA SA FIFO YAN — pansamantala lang ito habang walang backend batch support
  // Kapag nag-integrate na ang backend ng batch tracking, alisin na ang function na ito
  const existing = _readBatches(itemId);
  if (existing.length === 0 && currentStock > 0) {
    const initialBatch = {
      batchId: 1,
      quantity: Number(currentStock),
      // Gamitin ang kasalukuyang petsa — walang paraan malaman ang tunay na date ng unang stock
      // TODO (BACKEND): Gamitin ang actual na createdAt ng item mula sa database
      dateAdded: new Date().toISOString(),
    };
    _writeBatches(itemId, [initialBatch]);
  }
}

/**
 * Burahin ang lahat ng batches ng isang item (hal. kapag na-archive).
 * TODO (BACKEND): Palitan ng DELETE /api/inventory/:id/batches
 */
export function clearBatches(itemId) {
  // PARA SA FIFO YAN — i-clear ang batches kapag na-archive ang item
  localStorage.removeItem(FIFO_KEY_PREFIX + itemId);
}
