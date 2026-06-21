// components/RosterCreator.tsx
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Replace lines 7-11 in components/RosterCreator.tsx with this:
interface RosterCreatorProps {
  selectedChar: any;
  setSelectedChar: (char: any) => void;
  fetchRoster: () => void;
}

export default function RosterCreator({ selectedChar, setSelectedChar, fetchRoster }: RosterCreatorProps) {
  const [charName, setCharName] = useState('');
  const [rarity, setRarity] = useState('R');
  const [power, setPower] = useState(1000);
  const [anilistId, setAnilistId] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  

  // Cropper State
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);

  // Detect Selected Character to trigger Edit Mode
  useEffect(() => {
    if (selectedChar) {
      setCharName(selectedChar.name);
      setRarity(selectedChar.rarity);
      setPower(selectedChar.true_power);
      setAnilistId(selectedChar.anilist_id ? String(selectedChar.anilist_id) : '');
    } else {
      handleClearSelection();
    }
  }, [selectedChar]);

  const handleClearSelection = () => {
    setSelectedChar(null);
    setCharName('');
    setRarity('R');
    setPower(1000);
    setAnilistId('');
    setImgSrc('');
    setCompletedCrop(null);
    setCroppedFile(null);
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 2 / 3, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const getCroppedImageBlob = (image: HTMLImageElement, crop: any): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, 200, 300);
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Canvas empty')), 'image/jpeg', 0.95);
    });
  };

  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      let charId = selectedChar?.id;

      if (selectedChar) {
        // --- EDIT / REBALANCE MODE ---
        const { error: dbError } = await supabase
          .from('characters_cache')
          .update({
            name: charName,
            rarity,
            true_power: Number(power),
            anilist_id: anilistId ? Number(anilistId) : null,
          })
          .eq('id', charId);

        if (dbError) throw new Error(dbError.message);
      } else {
        // --- CREATION MODE ---
        const { data: newChar, error: dbError } = await supabase
          .from('characters_cache')
          .insert({
            name: charName,
            rarity,
            true_power: Number(power),
            anilist_id: anilistId ? Number(anilistId) : null,
            ability_tags: []
          })
          .select('*')
          .single();

        if (dbError || !newChar) throw new Error(dbError?.message);
        charId = newChar.id;
      }

      // Upload portrait if present in state (replaces the old completedCrop check)
      if (croppedFile) {
        const fileToUpload = new File([croppedFile], `${charId}.jpg`, { type: 'image/jpeg' });
        await supabase.storage.from('portraits').upload(`${charId}.jpg`, fileToUpload, { upsert: true });

        const { data: { publicUrl } } = supabase.storage.from('portraits').getPublicUrl(`${charId}.jpg`);
        await supabase.from('characters_cache').update({ image_url: publicUrl }).eq('id', charId);
      }

      alert(`🎉 Successfully ${selectedChar ? 'Updated' : 'Created'}: ${charName}!`);
      fetchRoster();
      if (!selectedChar) handleClearSelection();
    } catch (err: any) {
      alert(err.message);
    }
    setFormLoading(false);
  };

  return (
    <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800 max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-md font-bold">{selectedChar ? '⚙️ Edit Character / Rebalance' : '👤 Create New Card Variant'}</h2>
        {selectedChar && (
          <button type="button" onClick={handleClearSelection} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-1 px-3 rounded text-xs">
            + New Character
          </button>
        )}
      </div>

      <form onSubmit={handleSaveCharacter} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Unit Name</label>
          <input
            type="text"
            required
            value={charName}
            onChange={(e) => setCharName(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Rarity</label>
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
            >
              <option value="R">R</option>
              <option value="SR">SR</option>
              <option value="SSR">SSR</option>
              <option value="UR">UR</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Base Power</label>
            <input
              type="number"
              required
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">AniList ID (Optional)</label>
          <input
            type="number"
            value={anilistId}
            onChange={(e) => setAnilistId(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
            placeholder="e.g. 422"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">
            {selectedChar ? 'Update Portrait (Optional)' : 'Upload Portrait File'}
          </label>
          <input type="file" accept="image/*" onChange={onSelectFile} className="w-full text-xs text-neutral-400 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-neutral-800 file:text-neutral-300" />
        </div>

        <button type="submit" disabled={formLoading} className="w-full bg-neutral-100 hover:bg-white text-neutral-900 font-semibold py-2 px-4 rounded text-sm disabled:opacity-50 transition-all">
          {formLoading ? 'Saving...' : selectedChar ? 'Commit Rebalance' : 'Save & Upload Card'}
        </button>
      </form>

      {/* --- VISUAL CROPPER MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 p-6 rounded-lg max-w-lg w-full border border-neutral-800 shadow-2xl flex flex-col items-center">
            <h3 className="text-md font-bold mb-4 text-center">🎨 Adjust Card Portrait Crop</h3>
            <div className="max-h-[400px] overflow-auto mb-4 border border-neutral-800 rounded">
              <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={2 / 3}>
                <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Source" className="max-w-full h-auto" />
              </ReactCrop>
            </div>
            {/* Replace the button inside the modalOpen block with this: */}
              <button
                onClick={async () => {
                  if (imgRef.current && completedCrop) {
                    try {
                      const blob = await getCroppedImageBlob(imgRef.current, completedCrop);
                      const file = new File([blob], "temp.jpg", { type: 'image/jpeg' });
                      setCroppedFile(file);
                    } catch (e) {
                      console.error("Failed to crop image:", e);
                    }
                  }
                  setModalOpen(false);
                }}
                className="bg-neutral-100 hover:bg-white text-neutral-900 px-6 py-2 rounded text-sm font-semibold transition-all w-full"
              >
                Apply Crop Selection
              </button>
          </div>
        </div>
      )}
    </div>
  );
}