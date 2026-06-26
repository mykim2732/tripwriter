"use client";

import { useMemo, useState } from "react";

const emojiGroups = {
  감정: "😀 😃 😄 😁 😊 🙂 😌 😍 🥰 😘 😋 😎 🤗 🤭 🥹 😇 😉 😆 😅 😂 🤣 😢 😭 😮 😲 😴 😌 🙏".split(" "),
  여행: "✈️ 🧳 🏕️ 🏖️ 🏝️ 🏞️ 🏔️ 🗻 🚗 🚙 🚄 🚅 🚕 🚌 🚲 🛵 🚢 ⛴️ 🗺️ 🧭 🛤️ 🌅 🌄 🌇 🌉 🏙️ 🏡".split(" "),
  "맛집/카페": "🍽️ 🍴 🥄 🍚 🍜 🍝 🍣 🍱 🍔 🍟 🍕 🥗 🥘 🍲 🥩 🍗 🍤 🍰 🧁 🍮 🍦 🍧 ☕️ 🍵 🧋 🥤 🍶".split(" "),
  "리뷰/제품": "📦 🛍️ 🎁 🧾 📝 🔍 💡 🔋 💻 📱 ⌚️ 🎧 📷 🖥️ ⌨️ 🖱️ 🧴 👟 👕 👜 💄 🪞 🧼 🧻 🧸 🛠️".split(" "),
  "육아/일상": "👶 🧒 👧 👦 👨‍👩‍👧 👨‍👩‍👦 🍼 🧸 🎈 🎨 📚 🏫 🛝 🧩 🛁 🛏️ 🏠 🧺 🍳 🧹 🌿 🐾 🚶‍♀️ 🧘‍♀️ 🛒 💬".split(" "),
  "체크/강조": "✅ ☑️ ✔️ ❌ ⭕️ ⭐️ 🌟 ✨ 💫 🔥 💯 📌 📍 🔖 🧡 💚 💙 💜 🖤 🤍 ❗️ ❕ ❓ ❔ ⚠️ 👍".split(" "),
  "계절/날씨": "☀️ 🌤️ ⛅️ ☁️ 🌧️ ☔️ ⛈️ ❄️ ☃️ 🌈 🌊 🍃 🍂 🍁 🌸 🌼 🌻 🌷 🌹 🌺 🌿 🌲 🌳 🪴 🌙 ⭐️".split(" "),
  "별/하트": "❤️ 🧡 💛 💚 💙 💜 🤎 🖤 🤍 💖 💗 💓 💞 💕 💘 💝 💟 ❣️ ⭐️ 🌟 ✨ 💫 🌙 ☄️ 🔆 🫶".split(" "),
};

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  const visibleGroups = useMemo(() => {
    if (expanded) return emojiGroups;

    const firstThirty = Object.entries(emojiGroups).flatMap(([group, emojis]) =>
      emojis.map((emoji) => ({ group, emoji })),
    ).slice(0, 30);

    return {
      추천: firstThirty.map((item) => item.emoji),
    };
  }, [expanded]);

  function selectEmoji(emoji: string) {
    setRecent((items) => [emoji, ...items.filter((item) => item !== emoji)].slice(0, 12));
    onSelect(emoji);
  }

  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">이모지 넣기</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">커서 위치에 이모지를 빠르게 추가해요.</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700"
        >
          {expanded ? "접기" : "더 보기"}
        </button>
      </div>

      {recent.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-bold text-slate-500">최근 사용</p>
          <div className="mt-2 grid grid-cols-8 gap-1.5">
            {recent.map((emoji) => (
              <EmojiButton key={emoji} emoji={emoji} onClick={selectEmoji} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 space-y-3">
        {Object.entries(visibleGroups).map(([group, emojis]) => (
          <div key={group}>
            <p className="text-xs font-bold text-slate-500">{group}</p>
            <div className="mt-2 grid grid-cols-8 gap-1.5">
              {emojis.map((emoji, index) => (
                <EmojiButton key={`${emoji}-${index}`} emoji={emoji} onClick={selectEmoji} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmojiButton({ emoji, onClick }: { emoji: string; onClick: (emoji: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(emoji)}
      className="flex aspect-square items-center justify-center rounded-xl bg-white text-lg shadow-sm active:scale-95"
      aria-label={`${emoji} 삽입`}
    >
      {emoji}
    </button>
  );
}

