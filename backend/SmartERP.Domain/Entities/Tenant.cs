namespace SmartERP.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string SchemaName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<Location> Locations { get; set; } = [];
    public ICollection<AppUser> Users { get; set; } = [];
}