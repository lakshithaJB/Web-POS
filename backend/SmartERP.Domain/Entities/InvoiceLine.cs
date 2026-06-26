using SmartERP.Domain.Enums;

namespace SmartERP.Domain.Entities;

public class InvoiceLine : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public decimal Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
    public bool IsFree { get; set; }
    public BillLineStatus Status { get; set; } = BillLineStatus.Active;
    public string? Note { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public Product Product { get; set; } = null!;
}