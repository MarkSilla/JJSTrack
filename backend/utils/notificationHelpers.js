import mongoose from 'mongoose';
import notificationModel from '../models/notificationModel.js';
import { getRequestActor } from './requestActor.js';
import { broadcastNotificationCreated } from './notificationSocketServer.js';

export const resolveNotificationAudience = (role = 'user') => {
  if (role === 'admin') return 'admin';
  if (role === 'staff') return 'staff';
  return 'user';
};

const resolveActorPayload = async (req, fallbackRole = 'system') => {
  if (!req) {
    return { createdByRole: fallbackRole };
  }

  const actor = await getRequestActor(req);

  return {
    createdById:
      actor?._id && mongoose.isValidObjectId(actor._id)
        ? actor._id
        : undefined,
    createdByRole: actor?.role || fallbackRole,
  };
};

export const createNotification = async ({
  audience = 'admin',
  type = 'system',
  title,
  message,
  route = '',
  recipientId,
  entityId,
  entityModel = '',
  metadata = {},
  req = null,
  createdByRole = 'system',
}) => {
  if (!title || !message) return null;

  try {
    const actor = await resolveActorPayload(req, createdByRole);
    const payload = {
      audience,
      type,
      title: String(title).trim(),
      message: String(message).trim(),
      route,
      entityModel,
      metadata,
      createdByRole: actor.createdByRole,
    };

    if (recipientId && mongoose.isValidObjectId(recipientId)) {
      payload.recipientId = recipientId;
    }

    if (actor.createdById) {
      payload.createdById = actor.createdById;
    }

    if (entityId && mongoose.isValidObjectId(entityId)) {
      payload.entityId = entityId;
    }

    const createdNotification = await notificationModel.create(payload);
    broadcastNotificationCreated(createdNotification);
    return createdNotification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

const getInventoryLevel = (stock = 0, minStock = 0) => {
  const normalizedStock = Math.max(0, Number(stock) || 0);
  const normalizedMin = Math.max(0, Number(minStock) || 0);

  if (normalizedStock <= 0) return 'out';
  if (normalizedStock <= normalizedMin) return 'low';
  return 'normal';
};

const formatInventoryQuantity = (stock = 0, unit = '') => {
  const normalizedStock = Math.max(0, Number(stock) || 0);
  return unit ? `${normalizedStock} ${unit}` : `${normalizedStock}`;
};

export const shouldCreateInventoryRestockNotification = ({
  inventory,
  previousStock = 0,
  previousMinStock = 0,
}) => {
  if (!inventory?._id) return false;

  const previousLevel = getInventoryLevel(previousStock, previousMinStock);
  const nextLevel = getInventoryLevel(inventory.stock, inventory.minStock);
  const stockIncreased = Number(inventory.stock) > Number(previousStock);

  if (!stockIncreased) {
    return false;
  }

  if (previousLevel === 'out') {
    return nextLevel === 'low' || nextLevel === 'normal';
  }

  if (previousLevel === 'low') {
    return nextLevel === 'normal';
  }

  return false;
};

export const createInventoryEventNotification = async ({
  req,
  inventory,
  event = '',
  previousStock = 0,
  amount = 0,
}) => {
  if (!inventory?._id || !event) return null;

  const normalizedAmount = Math.max(0, Number(amount) || 0);
  const currentQuantity = formatInventoryQuantity(inventory.stock, inventory.unit);
  const previousQuantity = formatInventoryQuantity(previousStock, inventory.unit);

  let title = '';
  let message = '';

  switch (event) {
    case 'created':
      title = 'New inventory item added';
      message = `${inventory.name} was added to inventory with ${currentQuantity} available.`;
      break;
    case 'restocked':
      title = 'Inventory restocked';
      message = `${inventory.name} was replenished from ${previousQuantity} to ${currentQuantity}.`;
      break;
    case 'archived':
      title = 'Inventory item archived';
      message = `${inventory.name} was archived and removed from active inventory.`;
      break;
    case 'restored':
      title = 'Inventory item restored';
      message = `${inventory.name} was restored with ${currentQuantity} available.`;
      break;
    default:
      return null;
  }

  return createNotification({
    audience: 'admin',
    type: 'inventory',
    title,
    message,
    route: '/admin/inventory',
    entityId: inventory._id,
    entityModel: 'Inventory',
    metadata: {
      event,
      stock: inventory.stock,
      minStock: inventory.minStock,
      sku: inventory.sku || '',
      previousStock,
      amount: normalizedAmount,
    },
    req,
  });
};

export const maybeCreateInventoryNotification = async ({
  req,
  inventory,
  previousStock = 0,
  previousMinStock = 0,
}) => {
  if (!inventory?._id) return null;

  const previousLevel = getInventoryLevel(previousStock, previousMinStock);
  const nextLevel = getInventoryLevel(inventory.stock, inventory.minStock);

  if (nextLevel === previousLevel || nextLevel === 'normal') {
    return null;
  }

  const title =
    nextLevel === 'out' ? 'Inventory out of stock' : 'Inventory running low';
  const message =
    nextLevel === 'out'
      ? `${inventory.name} is out of stock and needs replenishment.`
      : `${inventory.name} is down to ${inventory.stock} ${inventory.unit}.`;

  return createNotification({
    audience: 'admin',
    type: 'inventory',
    title,
    message,
    route: '/admin/inventory',
    entityId: inventory._id,
    entityModel: 'Inventory',
    metadata: {
      level: nextLevel,
      stock: inventory.stock,
      minStock: inventory.minStock,
      sku: inventory.sku || '',
    },
    req,
  });
};
