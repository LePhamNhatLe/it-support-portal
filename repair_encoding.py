from pathlib import Path
import re
files = [Path('pages/devices.html'), Path('pages/network.html'), Path('pages/reports.html'), Path('pages/settings.html'), Path('pages/users.html')]
all_words = set()
for p in files:
    text = p.read_text(encoding='utf-8', errors='replace')
    for word in re.findall(r"[\w\?\uFFFD\u00C0-\u017F]+", text):
        if '�' in word or '?' in word or '�' in word:
            all_words.add(word)
with open('repair_encoding_output.txt', 'w', encoding='utf-8') as out:
    for word in sorted(all_words):
        out.write(word + '\n')
