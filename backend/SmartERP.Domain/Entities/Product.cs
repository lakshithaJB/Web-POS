namespace SmartERP.Domain.Entities;

public class Product : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid LocationId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string InvoiceName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal MinPrice { get; set; }
    public decimal TaxRate { get; set; }
    public bool TaxInclusive { get; set; }
    public bool HasModifiers { get; set; }
    public bool IsWeighted { get; set; }
    public bool TrackStock { get; set; } = true;
    public decimal StockQty { get; set; }
    public string? PluCode { get; set; }
    public string? RefCode1 { get; set; }
    public string? RefCode2 { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public Category Category { get; set; } = null!;
}