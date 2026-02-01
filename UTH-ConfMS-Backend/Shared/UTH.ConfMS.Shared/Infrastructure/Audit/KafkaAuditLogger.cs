using Confluent.Kafka;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace UTH.ConfMS.Shared.Infrastructure.Audit
{
    public interface IAuditLogger
    {
        Task LogAsync<T>(string action, string user, T data);
    }

    public class KafkaAuditLogger : IAuditLogger
    {
        private readonly string _topic = "uth.audit.logs";
        private readonly IProducer<Null, string>? _producer;
        private readonly ILogger<KafkaAuditLogger> _logger;

        public KafkaAuditLogger(IConfiguration configuration, ILogger<KafkaAuditLogger> logger)
        {
            _logger = logger;
            try 
            {
                var bootstrapServers = configuration["Kafka:BootstrapServers"] ?? "localhost:9092";
                var config = new ProducerConfig { BootstrapServers = bootstrapServers };
                _producer = new ProducerBuilder<Null, string>(config).Build();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Kafka Producer. Audit logs will be skipped.");
                _producer = null; // Soft fail to avoid crashing app if Kafka is down
            }
        }

        public async Task LogAsync<T>(string action, string user, T data)
        {
            if (_producer == null) return;

            var logEntry = new
            {
                Timestamp = DateTime.UtcNow,
                Action = action,
                User = user,
                Data = data
            };

            var message = JsonSerializer.Serialize(logEntry);

            try
            {
                await _producer.ProduceAsync(_topic, new Message<Null, string> { Value = message });
                _logger.LogInformation($"Audit Log sent to Kafka: {action}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending audit log to Kafka");
            }
        }
    }
}
