namespace SmartERP.Domain.Entities;

public class Category : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public Category? Parent { get; set; }
    public ICollection<Product> Products { get; set; } = [];
}