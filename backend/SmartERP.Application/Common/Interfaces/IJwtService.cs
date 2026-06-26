using SmartERP.Domain.Entities;

namespace SmartERP.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateToken(AppUser user, Guid locationId, Guid terminalId, Guid? shiftId = null);
}