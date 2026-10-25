using System.Diagnostics;

namespace Huiliu.Launcher;

internal static class Program
{
    [STAThread]
    private static int Main()
    {
        var root = AppContext.BaseDirectory;
        var engine = Path.Combine(root, "engine", "VNEngine.exe");
        var game = Path.Combine(root, "game");
        if (!File.Exists(engine) || !File.Exists(Path.Combine(game, "index.html")) || !File.Exists(Path.Combine(game, "project.json")))
        {
            MessageBox.Show("《回留》文件不完整。请完整解压发行包后再运行 RESET.exe。", "回留 / RESET", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
        try
        {
            var start = new ProcessStartInfo(engine) { WorkingDirectory = root, UseShellExecute = false };
            start.ArgumentList.Add("--game");
            start.ArgumentList.Add(game);
            Process.Start(start);
            return 0;
        }
        catch (Exception error)
        {
            MessageBox.Show("《回留》启动失败：\n" + error.Message, "回留 / RESET", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 2;
        }
    }
}
