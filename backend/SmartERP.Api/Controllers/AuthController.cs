using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartERP.Application.Common.Interfaces;

namespace SmartERP.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAppDbContext db, IJwtService jwt) : ControllerBase
{
    public record PinLoginRequest(string Pin, Guid TerminalId);
    public record UnlockRequest(string Pin, Guid UserId);

    [HttpPost("pin-login")]
    public async Task<IActionResult> PinLogin([FromBody] PinLoginRequest req)
    {
        var terminal = await db.Terminals
            .Include(t => t.Location)
            .FirstOrDefaultAsync(t => t.Id == req.TerminalId);

        if (terminal is null) return NotFound("Terminal not found");

        var users = await db.Users
            .Where(u => u.TenantId == terminal.Location.TenantId && u.IsActive)
            .ToListAsync();

        var user = users.FirstOrDefault(u => BCrypt.Net.BCrypt.Verify(req.Pin, u.PinHash));
        if (user is null) return Unauthorized("Invalid PIN");

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var token = jwt.GenerateToken(user, terminal.LocationId, terminal.Id);
        return Ok(new
        {
            token,
            user = new
            {
                id = user.Id,
                username = user.Username,
                displayName = user.DisplayName,
                role = user.Role.ToString(),
                tenantId = user.TenantId,
                locationId = terminal.LocationId,
                terminalId = terminal.Id,
            }
        });
    }

    [HttpPost("unlock")]
    public async Task<IActionResult> Unlock([FromBody] UnlockRequest req)
    {
        var user = await db.Users.FindAsync(req.UserId);
        if (user is null || !user.IsActive) return Unauthorized();
        if (!BCrypt.Net.BCrypt.Verify(req.Pin, user.PinHash)) return Unauthorized("Invalid PIN");

        // Re-issue token — terminal/location extracted from current token claims
        var terminalId = Guid.Parse(User.FindFirst("terminalId")?.Value ?? Guid.Empty.ToString());
        var locationId = Guid.Parse(User.FindFirst("locationId")?.Value ?? Guid.Empty.ToString());
        var token = jwt.GenerateToken(user, locationId, terminalId);
        return Ok(new { token });
    }
}