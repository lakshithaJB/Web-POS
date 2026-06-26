using SmartERP.Domain.Enums;

namespace SmartERP.Domain.Entities;

public class SalesReturnLine : BaseEntity
{
    public Guid SalesReturnId { get; set; }
    public Guid OriginalLineId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal ReturnQty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal ReturnTotal { get; set; }
    public ReturnReason Reason { get; set; }
    public SalesReturn SalesReturn { get; set; } = null!;
}