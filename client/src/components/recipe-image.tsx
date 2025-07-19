interface RecipeImageProps {
  recipeName: string;
  className?: string;
}

export function RecipeImage({ recipeName, className = "w-full h-48" }: RecipeImageProps) {
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
      return { icon: '⭕', gradient: 'from-cream-200 to-yellow-200' };
    }
    if (lowercaseName.includes('biscuit') || lowercaseName.includes('cookie')) {
      return { icon: '🍪', gradient: 'from-orange-200 to-brown-300' };
    }
    if (lowercaseName.includes('millefeuille')) {
      return { icon: '📐', gradient: 'from-cream-100 to-yellow-200' };
    }
    if (lowercaseName.includes('chocolat') || lowercaseName.includes('chocolate')) {
      return { icon: '🍫', gradient: 'from-brown-300 to-amber-400' };
    }
    if (lowercaseName.includes('fruit') || lowercaseName.includes('fraise') || lowercaseName.includes('pomme')) {
      return { icon: '🍓', gradient: 'from-red-200 to-pink-300' };
    }
    
    // Default pastry
    return { icon: '🧁', gradient: 'from-amber-100 to-orange-200' };
  };

  const { icon, gradient } = getRecipeVisual(recipeName);

  return (
    <div 
      className={`${className} bg-gradient-to-br ${gradient} flex items-center justify-center rounded-t-lg relative overflow-hidden`}
    >
      <div className="text-6xl opacity-90 transform hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
    </div>
  );
}