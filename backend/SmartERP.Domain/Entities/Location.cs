using SmartERP.Domain.Enums;

namespace SmartERP.Domain.Entities;

public class Location : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string InvoicePrefix { get; set; } = string.Empty;
    public PosMode DefaultMode { get; set; } = PosMode.Retail;
    public bool IsActive { get; set; } = true;
    public Tenant Tenant { get; set; } = null!;
    public ICollection<Terminal> Terminals { get; set; } = [];
}