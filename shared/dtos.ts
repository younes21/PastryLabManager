// Types pour l'annulation de livraison
interface CancellationItem {
    articleId: number;
    zones: Array<{
        zoneId: number;
        lotId: number | null;
        wasteQuantity: number;
        returnQuantity: number;
        wasteReason: string;
        returnReason: string;
    }>;
}

interface CancellationData {
    returnReason?: string;
    WasteReason?: string;
    cancellationItems: CancellationItem[];
}