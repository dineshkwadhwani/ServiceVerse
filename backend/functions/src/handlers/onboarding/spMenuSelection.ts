import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';

const logger = new Logger('SPMenuSelection');

export interface MenuItemSelection {
  menuItemId: string;
  name: string;
  selected: boolean;
  price: number;
}

/**
 * Get SP's service ID from their service associations
 */
export async function getSPServiceId(req: AuthRequest, res: Response) {
  try {
    const { spId } = req.params;

    if (!spId) {
      return sendError(res, new ValidationError('Missing spId'));
    }

    logger.info('Fetching SP service ID', { spId });

    // Get the user's service associations
    const snapshot = await db
      .collection('users')
      .doc(spId)
      .collection('serviceAssociations')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return sendError(res, new ValidationError('No service association found for this SP'));
    }

    const serviceId = snapshot.docs[0].id;
    logger.info('Found service ID for SP', { spId, serviceId });

    return sendSuccess(res, { serviceId });
  } catch (error: any) {
    logger.error('Failed to get SP service ID', error);
    return sendError(res, error);
  }
}

/**
 * Save SP's selected menu items and their pricing
 * Called during AM onboarding of SP
 */
export async function saveSPMenuSelection(req: AuthRequest, res: Response) {
  try {
    const { spId, serviceId, menuItems } = req.body;

    if (!spId || !serviceId || !menuItems) {
      return sendError(res, new ValidationError('Missing required fields: spId, serviceId, menuItems'));
    }

    if (!Array.isArray(menuItems)) {
      return sendError(res, new ValidationError('menuItems must be an array'));
    }

    logger.info('Saving SP menu selection', { spId, serviceId, count: menuItems.length });

    // Validate all selected items have prices
    const invalidItems = menuItems.filter((item: any) => item.selected && (!item.price || isNaN(item.price)));
    if (invalidItems.length > 0) {
      return sendError(
        res,
        new ValidationError(`Price is mandatory for selected items. Invalid items: ${invalidItems.map((i: any) => i.name).join(', ')}`)
      );
    }

    // Save to SP document - create spMenu subcollection
    const spMenuRef = db.collection('serviceProviders').doc(spId).collection('spMenu');

    // Delete existing menu items first (replace with new selection)
    const existingItems = await spMenuRef.get();
    for (const doc of existingItems.docs) {
      await doc.ref.delete();
    }

    // Add selected items
    const selectedItems = menuItems.filter((item: any) => item.selected);

    for (const item of selectedItems) {
      await spMenuRef.doc(item.menuItemId).set({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        masterPrice: item.masterPrice, // Store original master price for reference
        customized: item.price !== item.masterPrice, // Flag if price was customized
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Also update SP document to mark onboarding status
    await db.collection('serviceProviders').doc(spId).update({
      menuConfigured: true,
      menuConfiguredAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info('SP menu selection saved', { spId, selectedCount: selectedItems.length });

    return sendSuccess(res, {
      spId,
      serviceId,
      selectedItemsCount: selectedItems.length,
      message: 'Menu selection saved successfully',
    });
  } catch (error: any) {
    logger.error('Failed to save SP menu selection', error);
    return sendError(res, error);
  }
}

/**
 * Get master menu items for a service
 * Used during onboarding to show AM what items are available
 */
export async function getServiceMasterMenu(req: AuthRequest, res: Response) {
  try {
    const { serviceId } = req.params;

    if (!serviceId) {
      return sendError(res, new ValidationError('Service ID required'));
    }

    logger.info('Fetching master menu for service', { serviceId });

    // Get service document which has menuItems embedded
    const serviceDoc = await db.collection('services').doc(serviceId).get();

    if (!serviceDoc.exists) {
      return sendError(res, new ValidationError('Service not found'));
    }

    const serviceData = serviceDoc.data() as any;
    const menuItems = serviceData.menuItems || [];

    return sendSuccess(res, { menuItems, count: menuItems.length });
  } catch (error: any) {
    logger.error('Failed to fetch master menu', error);
    return sendError(res, error);
  }
}

/**
 * Get SP's configured menu
 * Used by customers to see what items the SP offers
 */
export async function getSPMenu(req: AuthRequest, res: Response) {
  try {
    const { spId } = req.params;

    if (!spId) {
      return sendError(res, new ValidationError('SP ID required'));
    }

    logger.info('Fetching SP menu', { spId });

    const menuSnapshot = await db
      .collection('serviceProviders')
      .doc(spId)
      .collection('spMenu')
      .get();

    const menuItems = menuSnapshot.docs.map((doc) => ({
      menuItemId: doc.id,
      ...doc.data(),
    }));

    return sendSuccess(res, { menuItems, count: menuItems.length });
  } catch (error: any) {
    logger.error('Failed to fetch SP menu', error);
    return sendError(res, error);
  }
}
