interface RecipeImageProps {
  recipeName: string;
  className?: string;
  size?: number;
}

export function RecipeImage({ recipeName, className = "w-full h-48", size }: RecipeImageProps) {
  const getRecipeVisual = (name: string): { icon: string; gradient: string } => {
    const lowercaseName = name.toLowerCase();
    
    if (lowercaseName.includes('tarte') || lowercaseName.includes('tart')) {
      return { icon: '🥧', gradient: 'from-yellow-200 to-orange-300' };
    }
    if (lowercaseName.includes('gâteau') || lowercaseName.includes('cake') || lowercaseName.includes('gateau')) {
      return { icon: '🎂', gradient: 'from-pink-200 to-rose-300' };
    }
    if (lowercaseName.includes('croissant')) {
      return { icon: '🥐', gradient: 'from-amber-200 to-yellow-300' };
    }
    if (lowercaseName.includes('pain') || lowercaseName.includes('bread')) {
      return { icon: '🍞', gradient: 'from-amber-100 to-orange-200' };
    }
    if (lowercaseName.includes('madeleine')) {
      return { icon: '🧁', gradient: 'from-yellow-100 to-amber-200' };
    }
    if (lowercaseName.includes('macaron')) {
      return { icon: '🍪', gradient: 'from-purple-200 to-pink-300' };
    }
    if (lowercaseName.includes('éclair') || lowercaseName.includes('eclair')) {
      return { icon: '🥖', gradient: 'from-brown-200 to-yellow-300' };
    }
    if (lowercaseName.includes('chou')) {
      return { icon: '⭕', gradient: 'from-amber-200 to-yellow-200' };
    }
    if (lowercaseName.includes('biscuit') || lowercaseName.includes('cookie')) {
      return { icon: '🍪', gradient: 'from-orange-200 to-brown-300' };
    }
    if (lowercaseName.includes('millefeuille')) {
      return { icon: '📐', gradient: 'from-blue-100 to-yellow-200' };
    }
    if (lowercaseName.includes('chocolat') || lowercaseName.includes('chocolate')) {
      return { icon: '🍫', gradient: 'from-brown-300 to-amber-400' };
    }
    if (lowercaseName.includes('fruit') || lowercaseName.includes('fraise') || lowercaseName.includes('pomme')) {
      return { icon: '🍓', gradient: 'from-red-200 to-pink-300' };
    }
    if (lowercaseName.includes('citron') || lowercaseName.includes('lemon')) {
      return { icon: '🍋', gradient: 'from-yellow-200 to-lime-300' };
    }
    
    // Default pastry
    return { icon: '🧁', gradient: 'from-amber-100 to-orange-200' };
  };

  const { icon, gradient } = getRecipeVisual(recipeName);

  const containerStyle = size ? {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`
  } : {};

  const iconSize = size ? (size > 100 ? "text-4xl" : size > 60 ? "text-2xl" : "text-lg") : "text-4xl";

  return (
    <div 
      className={`${!size ? className : ''} bg-gradient-to-br ${gradient} flex items-center justify-center rounded-lg relative overflow-hidden`}
      style={containerStyle}
    >
      <span className={`${iconSize} select-none`} role="img" aria-label={recipeName}>
        {icon}
      </span>
    </div>
  );
}