import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '@/utils/firebase-config';
import { COLLECTIONS } from '@/utils/constants';
import type { CreateServiceFormData, Service } from '@/types';

async function uploadServiceImage(
  serviceId: string,
  file: File,
  imageType: 'logo' | 'hero'
): Promise<string> {
  const extension = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `services/${serviceId}/${imageType}.${extension}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

function mapServiceDoc(id: string, data: Record<string, unknown>): Service {
  return {
    serviceId: (data.serviceId as string) || id,
    name: data.name as string,
    description: data.description as string,
    logo: data.logo as string,
    heroImage: data.heroImage as string,
    colorTheme: data.colorTheme as Service['colorTheme'],
    fromEmail: data.fromEmail as string,
    fromName: data.fromName as string,
    gstPercentage: data.gstPercentage as number,
    defaultCommission: data.defaultCommission as Service['defaultCommission'],
    status: (data.status as Service['status']) || 'INACTIVE',
    createdBy: data.createdBy as string,
    createdAt:
      (data.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    updatedAt:
      (data.updatedAt as { toDate?: () => Date })?.toDate?.() || new Date(),
  };
}

export async function createService(data: CreateServiceFormData): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to create a service');
  }

  const serviceId = crypto.randomUUID();

  const [logoUrl, heroImageUrl] = await Promise.all([
    uploadServiceImage(serviceId, data.logo, 'logo'),
    uploadServiceImage(serviceId, data.heroImage, 'hero'),
  ]);

  const serviceData = {
    serviceId,
    name: data.name,
    description: data.description,
    logo: logoUrl,
    heroImage: heroImageUrl,
    colorTheme: data.colorTheme,
    fromEmail: data.fromEmail,
    fromName: data.fromName,
    gstPercentage: data.gstPercentage,
    defaultCommission: data.defaultCommission,
    status: 'INACTIVE' as const,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, COLLECTIONS.SERVICES, serviceId), serviceData);
  await setDoc(doc(db, COLLECTIONS.SERVICES, serviceId, 'menuItems', '_init'), {
    initialized: true,
  });

  return serviceId;
}

export async function toggleServiceStatus(
  serviceId: string,
  status: 'ACTIVE' | 'INACTIVE'
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.SERVICES, serviceId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function getActiveServices(): Promise<Service[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.SERVICES), where('status', '==', 'ACTIVE'))
  );

  return snapshot.docs
    .map((docSnap) => mapServiceDoc(docSnap.id, docSnap.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const services = await getActiveServices();
  return (
    services.find(
      (service) => service.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
    ) ?? null
  );
}

export async function getServices(
  page = 1,
  pageSize = 10
): Promise<{ services: Service[]; total: number }> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.SERVICES), orderBy('createdAt', 'desc'))
  );

  const allServices = snapshot.docs.map((docSnap) =>
    mapServiceDoc(docSnap.id, docSnap.data())
  );

  const start = (page - 1) * pageSize;

  return {
    services: allServices.slice(start, start + pageSize),
    total: allServices.length,
  };
}
