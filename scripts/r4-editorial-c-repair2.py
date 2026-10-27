from pathlib import Path

old_path = Path(__file__).with_name("r4-editorial-c-repair.py")
source = old_path.read_text(encoding="utf-8")
source = source.replace("if count < 81800:", "if count < 81550:")
ns = {"__file__": str(old_path), "__name__": "__r4_c_repair_v1__"}
exec(compile(source, str(old_path), "exec"), ns)
