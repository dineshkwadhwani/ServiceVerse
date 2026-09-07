import { useRef, useState } from 'react';
import { Camera, User } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/utils/firebase-config';
import { COLORS } from '@/utils/theme';
import { useToast } from '@/store/notificationStore';
import { resolveImageContentType, withTimeout } from '@/utils/imageUpload';

const MAX_SIZE_BYTES = 100 * 1024;
const UPLOAD_TIMEOUT_MS = 20_000;
const TIMEOUT_MESSAGE = 'Upload timed out - please check your connection and try again';

interface Props {
  uid: string;
  photoUrl?: string;
  onChange: (url: string) => void;
  name?: string;
}

export function ProfilePictureUpload({ uid, photoUrl, onChange, name }: Props) {
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Profile picture must be 100KB or smaller');
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `profile-pictures/${uid}/photo`);
      await withTimeout(
        uploadBytes(storageRef, file, { contentType: resolveImageContentType(file) }),
        UPLOAD_TIMEOUT_MS,
        TIMEOUT_MESSAGE
      );
      const url = await withTimeout(getDownloadURL(storageRef), UPLOAD_TIMEOUT_MS, TIMEOUT_MESSAGE);
      onChange(url);
    } catch (error: any) {
      console.error('Profile picture upload failed', { uid, code: error?.code, message: error?.message, error });
      toast.error(error?.message?.includes('timed out') ? error.message : `Failed to upload profile picture${error?.code ? ` (${error.code})` : ''}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center cursor-pointer"
        style={{ backgroundColor: COLORS.bg.hover }}
        onClick={() => fileInputRef.current?.click()}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : name ? (
          <span className="text-2xl font-semibold" style={{ color: COLORS.text.secondary }}>
            {name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <User className="w-8 h-8" style={{ color: COLORS.text.tertiary }} />
        )}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: COLORS.semantic.info }}
        >
          <Camera className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <div className="flex-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 rounded-lg border text-sm font-medium transition"
          style={{
            borderColor: COLORS.border.light,
            color: COLORS.text.primary,
            backgroundColor: COLORS.bg.primary,
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          {isUploading ? 'Uploading...' : photoUrl ? 'Change Photo' : 'Upload Photo'}
        </button>
        <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
          JPG, PNG or GIF · Max 100KB
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
