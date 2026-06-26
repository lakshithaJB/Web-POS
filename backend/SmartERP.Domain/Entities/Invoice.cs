using SmartERP.Domain.Enums;

namespace SmartERP.Domain.Entities;

public class Invoice : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid LocationId { get; set; }
    public Guid TerminalId { get; set; }
    public Guid ShiftId { get; set; }
    public Guid CashierId { get; set; }
    public Guid? CustomerId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Paid;
    public decimal Subtotal { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal NetTotal { get; set; }
    public decimal RoundingAmount { get; set; }
    public decimal PayableAmount { get; set; }
    public string? IdempotencyKey { get; set; }
    public Shift Shift { get; set; } = null!;
    public Customer? Customer { get; set; }
    public AppUser Cashier { get; set; } = null!;
    public ICollection<InvoiceLine> Lines { get; set; } = [];
    public ICollection<InvoicePayment> Payments { get; set; } = [];
}