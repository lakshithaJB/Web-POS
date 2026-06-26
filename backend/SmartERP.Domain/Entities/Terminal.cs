using SmartERP.Domain.Enums;

namespace SmartERP.Domain.Entities;

public class Terminal : BaseEntity
{
    public Guid LocationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public PosMode Mode { get; set; } = PosMode.Retail;
    public bool IsActive { get; set; } = true;
    public int AutoLockMinutes { get; set; } = 5;
    public string? ReceiptPrinterIp { get; set; }
    public string? KitchenPrinterIp { get; set; }
    public string InvoicePrefix { get; set; } = string.Empty;
    public Location Location { get; set; } = null!;
    public ICollection<Shift> Shifts { get; set; } = [];
}