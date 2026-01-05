namespace UTHConfMS.Core.Interfaces
{
    public interface IPaperService
    {
        Task SubmitPaperAsync(int paperId, int userId, string filePath);
    }
}
