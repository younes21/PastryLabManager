interface IngredientImageProps {
  ingredientName: string;
  className?: string;
}

export function IngredientImage({ ingredientName, className = "w-16 h-16" }: IngredientImageProps) {
  const getIngredientIcon = (name: string): { icon: string; color: string; bgColor: string } => {
    const lowercaseName = name.toLowerCase();
    
    if (lowercaseName.includes('farine') || lowercaseName.includes('flour')) {
      return { icon: '🌾', color: '#D4A574', bgColor: '#FEF3E2' };
    }
    if (lowercaseName.includes('oeuf') || lowercaseName.includes('egg')) {
      return { icon: '🥚', color: '#F7DC6F', bgColor: '#FFFBF0' };
    }
    if (lowercaseName.includes('beurre') || lowercaseName.includes('butter')) {
      return { icon: '🧈', color: '#F4D03F', bgColor: '#FFFEF7' };
    }
    if (lowercaseName.includes('lait') || lowercaseName.includes('milk')) {
      return { icon: '🥛', color: '#F8F9FA', bgColor: '#F8F9FA' };
    }
    if (lowercaseName.includes('sucre') || lowercaseName.includes('sugar')) {
      return { icon: '🍯', color: '#E8DAEF', bgColor: '#F4F6F7' };
    }
    if (lowercaseName.includes('chocolat') || lowercaseName.includes('chocolate')) {
      return { icon: '🍫', color: '#7D6608', bgColor: '#FDF2E9' };
    }
    if (lowercaseName.includes('vanille') || lowercaseName.includes('vanilla')) {
      return { icon: '🌿', color: '#7DCEA0', bgColor: '#E8F8F5' };
    }
    if (lowercaseName.includes('fruit') || lowercaseName.includes('pomme') || lowercaseName.includes('poire')) {
      return { icon: '🍎', color: '#E74C3C', bgColor: '#FDEDEC' };
    }
    if (lowercaseName.includes('crème') || lowercaseName.includes('cream')) {
      return { icon: '🥛', color: '#FAE5D3', bgColor: '#FEF9E7' };
    }
    if (lowercaseName.includes('levure') || lowercaseName.includes('yeast')) {
      return { icon: '⚡', color: '#F7DC6F', bgColor: '#FFFBF0' };
    }
    
    // Default
    return { icon: '🥄', color: '#85929E', bgColor: '#F4F6F7' };
  };

  const { icon, color, bgColor } = getIngredientIcon(ingredientName);

  return (
    <div 
      className={`${className} rounded-lg flex items-center justify-center text-2xl`}
      style={{ backgroundColor: bgColor, color }}
    >
      {icon}
    </div>
  );
}