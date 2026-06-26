using SmartERP.Domain.Enums;

namespace SmartERP.Domain.Entities;

public class Customer : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string? Email { get; set; }
    public CustomerType CustomerType { get; set; } = CustomerType.Retail;
    public CustomerStatus Status { get; set; } = CustomerStatus.Active;
    public decimal CreditLimit { get; set; }
    public decimal OutstandingBalance { get; set; }
    public decimal DefaultDiscountPercent { get; set; }
    public bool CreditAllowed { get; set; }
    public int LoyaltyPoints { get; set; }
    public string PriceLevel { get; set; } = "Retail";
    public DateOnly? Birthday { get; set; }
    public DateOnly? Anniversary { get; set; }
    public ICollection<Invoice> Invoices { get; set; } = [];
}