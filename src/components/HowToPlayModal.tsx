import React from 'react';
import { X, BookOpen, Key, AlertTriangle, ShieldCheck, HeartPulse, Footprints } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <h3 className="text-xl font-bold font-mono tracking-wider text-red-500 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {lang === 'ar' ? 'دليل النجاة والهروب من غرانّي' : 'SURVIVAL & ESCAPE GUIDE'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="py-4 space-y-5 text-xs md:text-sm font-sans leading-relaxed">
          {/* 1. Granny AI & Sound */}
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
            <div className="font-bold text-red-400 flex items-center gap-2 mb-1 font-mono">
              <Footprints className="w-4 h-4" />
              {lang === 'ar' ? '1. ذكاء غرانّي وحاسة السمع الخارقة' : '1. GRANNY AI & SOUND PERCEPTION'}
            </div>
            <p className="text-neutral-300">
              {lang === 'ar'
                ? 'غرانّي تسمع كل صوت يصدره اللاعبون في المنزل! الجري السريع، إسقاط الأغراض، فتح الأبواب والوقوع في فخاخ الدببة يصدر موجات صوتية تجعل غرانّي تتوجه مسرعة لموقعك. استخدم المشي الهادئ أو الزحف (Crouch) لتكون صامتاً تماماً.'
                : 'Granny hears all noises in the mansion! Sprinting, dropping items, squeaky doors, and stepping on bear traps emit noise pulses that alert Granny immediately. Crouch or walk slowly to stay undetected.'}
            </p>
          </div>

          {/* 2. Days & Downed Teammates */}
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
            <div className="font-bold text-amber-400 flex items-center gap-2 mb-1 font-mono">
              <HeartPulse className="w-4 h-4" />
              {lang === 'ar' ? '2. نظام الأيام الخمسة وإنقاذ الزملاء' : '2. 5 DAYS SYSTEM & REVIVING TEAMMATES'}
            </div>
            <p className="text-neutral-300">
              {lang === 'ar'
                ? 'إذا ضربت غرانّي لاعباً، يسقط مغشياً عليه على الأرض ولديه 45 ثانية! يمكن لأي زميل في الفريق التوجه إليه والضغط على تفاعل [E] أو استخدام حقيبة الإسعاف (Medkit) لإنقاذه. إذا سقط جميع اللاعبين، تجركم غرانّي إلى غرفة النوم ويبدأ اليوم التالي (اليوم 1 حتى 5). في اليوم الخامس تنتهي اللعبة نهائياً!'
                : 'When Granny hits a player with her bat, they enter the Downed state with a 45s timer! Any teammate can approach and press [E] or use a Medkit to revive them. If all active players are downed, a Day advances (Day 1 to 5). On Day 5, defeat is permanent!'}
            </p>
          </div>

          {/* 3. The 3 Escape Routes */}
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
            <div className="font-bold text-emerald-400 flex items-center gap-2 mb-2 font-mono">
              <Key className="w-4 h-4" />
              {lang === 'ar' ? '3. طرق الهروب الثلاثة (Escape Routes)' : '3. THREE ESCAPE ROUTES'}
            </div>
            <ul className="space-y-2 text-neutral-300 text-xs">
              <li>
                <strong className="text-white">🚪 {lang === 'ar' ? 'الباب الرئيسي (طابق 1):' : 'Main Exit Door (Floor 1):'}</strong>{' '}
                {lang === 'ar'
                  ? 'يتطلب خلع الألواح بالعتلة (Crowbar) + قطع سلك الإنذار بالكماشة (Pliers) + المفتاح الذهبي (Padlock Key) + المفتاح الرئيسي الأحمر (Master Key).'
                  : 'Pry planks with Crowbar + Cut alarm wire with Pliers + Padlock Key (Gold) + Master Key (Red).'}
              </li>
              <li>
                <strong className="text-white">🚗 {lang === 'ar' ? 'سيارة القبو (طابق 0):' : 'Basement Car (Floor 0):'}</strong>{' '}
                {lang === 'ar'
                  ? 'ابحث عن بطارية السيارة (Car Battery) + شمعة الإشعال (Spark Plug) + جركن البنزين (Gasoline Can) + مفتاح السيارة (Car Key).'
                  : 'Install Car Battery + Spark Plug + Refuel with Gasoline Can + Start with Car Key.'}
              </li>
              <li>
                <strong className="text-white">🕳️ {lang === 'ar' ? 'نفق الصرف الصحي (طابق 0):' : 'Sewer Tunnel (Floor 0):'}</strong>{' '}
                {lang === 'ar'
                  ? 'يتطلب مفتاح الصرف الصحي الصدئ (Sewer Key) + ترس رافعة البوابة (Cogwheel).'
                  : 'Unlock iron gate with Sewer Key + install Cogwheel to crank the gate open.'}
              </li>
            </ul>
          </div>

          {/* 4. Controls */}
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
            <div className="font-bold text-blue-400 flex items-center gap-2 mb-2 font-mono">
              <ShieldCheck className="w-4 h-4" />
              {lang === 'ar' ? '4. أزرار التحكم (الكمبيوتر والموبايل)' : '4. CONTROLS (DESKTOP & MOBILE)'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-neutral-300">
              <div>• WASD / الأسهم: {lang === 'ar' ? 'الحركة' : 'Movement'}</div>
              <div>• Shift: {lang === 'ar' ? 'الجري السريع' : 'Sprint'}</div>
              <div>• Ctrl / C: {lang === 'ar' ? 'الزحف الصامت' : 'Crouch / Sneak'}</div>
              <div>• E: {lang === 'ar' ? 'التفاعل / الأبواب / المخابئ' : 'Interact / Open / Hide'}</div>
              <div>• Space: {lang === 'ar' ? 'استخدام العنصر / السلاح' : 'Use Item / Shoot Gun'}</div>
              <div>• G: {lang === 'ar' ? 'إلقاء العنصر المجهز' : 'Drop Equipped Item'}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-white font-mono text-xs font-bold cursor-pointer"
          >
            {lang === 'ar' ? 'فهمت، أريد النجاة!' : 'GOT IT, READY TO SURVIVE!'}
          </button>
        </div>
      </div>
    </div>
  );
};
