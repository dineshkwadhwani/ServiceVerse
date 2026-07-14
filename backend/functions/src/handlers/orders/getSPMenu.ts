import { Request, Response } from 'express';
import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';

const logger = new Logger('GetSPMenu');

/**
 * Get SP's configured menu items for order creation
 * GET /service-providers/:spId/menu
 */
export const getSPConfiguredMenu = async (req: Request, res: Response) => {
  try {
    const { spId } = req.params;

    if (!spId) {
      return res.status(400).json({
        success: false,
        error: 'Service Provider ID is required',
      });
    }

    // Get the SP's service ID from service associations
    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists || spDoc.data()?.role !== 'SERVICE_PROVIDER') {
      return res.status(404).json({
        success: false,
        error: 'Service Provider not found',
      });
    }

    // Get service associations to find the service ID
    const serviceAssociations = await db
      .collection('users')
      .doc(spId)
      .collection('serviceAssociations')
      .limit(1)
      .get();

    if (serviceAssociations.empty) {
      return res.status(200).json({
        success: true,
        data: { menuItems: [] },
      });
    }

    const serviceId = serviceAssociations.docs[0].id;

    // Get the SP's configured menu items
    const spData = spDoc.data();

    // Menu items can be stored in:
    // 1. customMenus[serviceId] (structured during onboarding)
    // 2. configuredMenuItems (direct array)
    const customMenus = spData?.customMenus || {};
    let configuredMenuItems = customMenus[serviceId] || [];

    // Fallback: check if there's a direct configuredMenuItems array
    if (configuredMenuItems.length === 0 && spData?.configuredMenuItems) {
      configuredMenuItems = Array.isArray(spData.configuredMenuItems)
        ? spData.configuredMenuItems
        : Object.values(spData.configuredMenuItems || {});
    }

    logger.info('SP menu retrieved', {
      spId,
      serviceId,
      count: configuredMenuItems.length,
      hasCustomMenus: !!customMenus[serviceId],
      allData: JSON.stringify({customMenus, configuredMenuItems: spData?.configuredMenuItems})
    });

    return res.status(200).json({
      success: true,
      data: {
        menuItems: configuredMenuItems || [],
        serviceId,
      },
    });
  } catch (error: any) {
    logger.error('Get SP menu failed', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to get menu items',
    });
  }
};
