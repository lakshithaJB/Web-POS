using SmartERP.Domain.Enums;

namespace SmartERP.Domain.Entities;

public class SalesReturn : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid LocationId { get; set; }
    public Guid ShiftId { get; set; }
    public Guid CashierId { get; set; }
    public Guid OriginalInvoiceId { get; set; }
    public string SrnNumber { get; set; } = string.Empty;
    public RefundMethod RefundMethod { get; set; }
    public decimal TotalRefund { get; set; }
    public DateTime ReturnedAt { get; set; } = DateTime.UtcNow;
    public Invoice OriginalInvoice { get; set; } = null!;
    public ICollection<SalesReturnLine> Lines { get; set; } = [];
}