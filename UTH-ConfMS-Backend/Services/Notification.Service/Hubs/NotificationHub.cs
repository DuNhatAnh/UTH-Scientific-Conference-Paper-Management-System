using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Notification.Service.Hubs;

/// <summary>
/// SignalR Hub for real-time notifications
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        _logger.LogInformation("User {UserId} connected to NotificationHub. ConnectionId: {ConnectionId}", 
            userId, Context.ConnectionId);
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        _logger.LogInformation("User {UserId} disconnected from NotificationHub. ConnectionId: {ConnectionId}", 
            userId, Context.ConnectionId);
        
        if (exception != null)
        {
            _logger.LogError(exception, "User {UserId} disconnected with error", userId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}
