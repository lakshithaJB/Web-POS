using SmartERP.Domain.Enums;

namespace SmartERP.Domain.Entities;

public class Shift : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid LocationId { get; set; }
    public Guid TerminalId { get; set; }
    public Guid CashierId { get; set; }
    public ShiftStatus Status { get; set; } = ShiftStatus.Open;
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningFloat { get; set; }
    public decimal? CountedCash { get; set; }
    public decimal? Variance { get; set; }
    public int InvoiceBlockStart { get; set; }
    public int InvoiceBlockEnd { get; set; }
    public int InvoiceBlockCurrent { get; set; }
    public string? ZReportJson { get; set; }
    public Terminal Terminal { get; set; } = null!;
    public AppUser Cashier { get; set; } = null!;
    public ICollection<Invoice> Invoices { get; set; } = [];
    public ICollection<CashMovement> CashMovements { get; set; } = [];
}