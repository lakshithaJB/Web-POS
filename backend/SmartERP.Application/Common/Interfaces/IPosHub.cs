namespace SmartERP.Application.Common.Interfaces;

public interface IPosHub
{
    Task BroadcastPriceUpdate(Guid locationId, object priceData);
    Task BroadcastStockUpdate(Guid locationId, Guid productId, decimal newQty);
    Task BroadcastPromoActivated(Guid locationId, object promoData);
    Task NotifyGvRedeemed(Guid locationId, string gvCode, decimal remainingBalance);
}