using SmartERP.Domain.Enums;

namespace SmartERP.Domain.Entities;

public class AppUser : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PinHash { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public UserRole Role { get; set; } = UserRole.Cashier;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public Tenant Tenant { get; set; } = null!;
}