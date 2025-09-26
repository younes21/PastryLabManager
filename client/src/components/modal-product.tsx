import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Delete, LayoutGrid, RotateCcw, Package, Utensils } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Article } from "@shared/schema";

// --- Types ---


interface ProductSelectorCompactProps {
    products: Article[];
    value?: string | number | null; // id du produit sélectionné
    onSelect?: (productId: string | number) => void;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// --- Component ---
export default function ProductSelectorCompact({
    products,
    value,
    onSelect,
}: ProductSelectorCompactProps) {
    const [search, setSearch] = useState<string>("");
    const [selected, setSelected] = useState<Article | null>(null);
    const [filter, setFilter] = useState<string | null>(null);
    products = products.sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
    );
    // charger produit sélectionné au montage / mode edit
    useEffect(() => {
        if (value) {
            const found = products.find((p) => p.id == value) || null;
            setSelected(found);
        }
    }, [value, products]);

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
        && (!filter || p.type === filter)
    );

    const handleAddLetter = (letter: string) =>
        setSearch((prev) => prev + letter);

    const handleBackspace = () => setSearch((prev) => prev.slice(0, -1));

    const handleSelectProduct = (product: Article) => {
        setSelected(product);
        onSelect?.(product.id);
    };

    return (
        <Dialog>
            {/* Champ déclencheur */}
            <DialogTrigger asChild>
                <div className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 ring-offset-background h-8 text-sm md:text-sm cursor-pointer hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <span
                        className={`truncate ${selected ? "text-foreground" : "text-muted-foreground"
                            }`}
                    >
                        {selected ? selected.name : "Sélectionner un produit..."}
                    </span>
                    {/* Icône jolie à droite */}
                    <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0 ml-2 " />
                </div>
            </DialogTrigger>

            {/* Dialog compacte */}
            <DialogContent className="max-w-6xl max-h-[100vh] flex flex-col p-4">
                <DialogTitle className="sr-only">Sélection de produit</DialogTitle>
                <DialogBody>
                    {/* Recherche rapide */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-3 w-[95%] sm:w-[70%]">
                        {/* Ligne recherche + boutons */}
                        <div className="flex items-center gap-2 flex-1">
                            {/* Input prend toute la place dispo */}
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher..."
                                className="flex-1 px-3 py-2 border rounded-lg text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />

                            {/* Bouton Delete */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleBackspace}
                                className="shrink-0 h-10 w-10"
                            >
                                <Delete className="w-4 h-4" />
                            </Button>

                            {/* Bouton Reset */}
                            <button
                                onClick={() => setSearch("")}
                                className="h-10 w-10 flex items-center justify-center bg-red-400 text-white rounded-md shadow-md hover:bg-red-600"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Filtres en dessous */}
                        <ProductFilter onFilter={(activeFilters) => setFilter(activeFilters)} />
                    </div>



                    {/* Clavier tactile compact */}
                    <div className="grid grid-cols-9 gap-1 mb-3">
                        {alphabet.map((letter) => (
                            <Button
                                key={letter}
                                onClick={() => handleAddLetter(letter)}
                                className="px-0 py-2 text-xs font-medium bg-gray-100 hover:bg-orange-200 text-gray-800"
                            >
                                {letter}
                            </Button>
                        ))}
                    </div>

                    {/* Grille produits */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                Aucun produit trouvé
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3 p-4">
                                {filteredProducts.map((product) => (
                                    <DialogTrigger asChild key={product.id}>
                                        <button
                                            onClick={() => handleSelectProduct(product)}
                                            className={`bg-white relative rounded-lg shadow hover:shadow-lg transition-all flex flex-col ${selected?.id === product.id
                                                ? "ring-2 ring-orange-500"
                                                : ""
                                                }`}
                                        >
                                            <div className={`absolute top-1 left-1 flex text-xs font-bold shadow-md  rounded-xl  p-1  justify-center items-center ${product.type == 'product' ? 'bg-orange-400 ' : 'bg-green-300'} `}>
                                                <span>{product.type == 'product' ? 'PROD' : 'ING'}</span>
                                            </div>
                                            <img
                                                src={product.photo}
                                                alt={product.name}
                                                className="w-full h-28 object-cover rounded-t-lg"
                                            />
                                            <div className="p-2 text-center">
                                                <TooltipProvider delayDuration={100}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className="text-sm font-medium text-gray-900 truncate cursor-help">
                                                                {product.name}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="max-w-xs break-words">
                                                            {product.name}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>


                                            </div>
                                        </button>
                                    </DialogTrigger>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
type Props = {
    onFilter: (filter: string | null) => void;
};

export function ProductFilter({ onFilter }: Props) {
    const [active, setActive] = useState<string | null>(null);

    const handleClick = (filter: string) => {
        const newFilter = active === filter ? null : filter; // toggle on/off
        setActive(newFilter);
        onFilter(newFilter);
    };

    return (
        <div className="flex gap-2 ml-10">
            <Button

                variant={active === "product" ? "default" : "outline"}
                onClick={() => handleClick("product")}
            >
                Produits
            </Button>
            <Button
                variant={active === "ingredient" ? "default" : "outline"}
                onClick={() => handleClick("ingredient")}
            >
                Ingrédients
            </Button>
        </div>
    );
}