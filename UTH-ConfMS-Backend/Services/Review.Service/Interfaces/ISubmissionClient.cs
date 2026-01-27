using System.Threading.Tasks;

namespace Review.Service.Interfaces
{
    public interface ISubmissionClient
    {
        Task UpdateSubmissionStatusAsync(string paperId, string status);
    }
}
