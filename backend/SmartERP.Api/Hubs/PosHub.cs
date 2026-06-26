using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SmartERP.Api.Hubs;

[Authorize]
public class PosHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var locationId = Context.User?.FindFirst("locationId")?.Value;
        if (locationId is not null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"location-{locationId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var locationId = Context.User?.FindFirst("locationId")?.Value;
        if (locationId is not null)
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"location-{locationId}");
        await base.OnDisconnectedAsync(exception);
    }
}