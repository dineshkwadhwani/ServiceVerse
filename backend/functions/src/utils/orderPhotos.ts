import { db } from '@/utils/firebase';

/**
 * Overrides each order's customerPhotoUrl/selectedCoworkerPhotoUrl with the
 * person's CURRENT profile picture instead of the snapshot taken at order
 * creation/pickup-assignment time - important for fraud prevention, where you
 * want to verify against how someone looks now, not whenever the order happened
 * to be created. Falls back to the stored snapshot if the live lookup finds
 * nothing (e.g. the user doc no longer exists).
 *
 * Batches lookups so this costs at most one customer getAll() and one
 * coworker collection scan per call, regardless of how many orders are passed.
 */
export async function enrichOrdersWithLivePhotos(orders: any[]): Promise<any[]> {
  if (!orders.length) return orders;

  const customerIds = Array.from(new Set(orders.map((o) => o.customerId).filter(Boolean)));
  const needsCoworkerLookup = orders.some((o) => o.selectedCoworker);

  const customerPhotoMap = new Map<string, string>();
  if (customerIds.length) {
    const customerDocs = await db.getAll(...customerIds.map((id) => db.collection('users').doc(id)));
    customerDocs.forEach((doc) => {
      if (doc.exists) customerPhotoMap.set(doc.id, doc.data()?.photoUrl || '');
    });
  }

  // Queries only by role (like getSPCoworkers) and filters spId/name in memory
  // to avoid needing a composite index.
  const coworkerPhotoMap = new Map<string, string>(); // key: `${spId}::${name}`
  if (needsCoworkerLookup) {
    const coworkersSnapshot = await db.collection('users').where('role', '==', 'COWORKER').get();
    coworkersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      coworkerPhotoMap.set(`${data.spId}::${data.name}`, data.photoUrl || '');
    });
  }

  return orders.map((order) => ({
    ...order,
    customerPhotoUrl:
      (order.customerId && customerPhotoMap.get(order.customerId)) || order.customerPhotoUrl || null,
    selectedCoworkerPhotoUrl: order.selectedCoworker
      ? coworkerPhotoMap.get(`${order.spId}::${order.selectedCoworker}`) || order.selectedCoworkerPhotoUrl || null
      : order.selectedCoworkerPhotoUrl || null,
  }));
}
