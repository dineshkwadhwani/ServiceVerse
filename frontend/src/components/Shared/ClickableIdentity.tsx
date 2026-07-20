import { useState } from 'react';
import { PersonPreviewModal } from '@/components/Shared/PersonPreviewModal';
import { COLORS } from '@/utils/theme';

interface Props {
  name: string;
  photoUrl?: string;
  label?: string;
  prefix?: string;
}

export function ClickableIdentity({ name, photoUrl, label, prefix }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!name) return null;

  return (
    <>
      {prefix}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="underline underline-offset-2 font-medium hover:opacity-80 transition"
        style={{ color: COLORS.semantic.info }}
      >
        {name}
      </button>
      <PersonPreviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        name={name}
        photoUrl={photoUrl}
        label={label}
      />
    </>
  );
}
