import sys
sys.path.insert(0, '/Users/nicholas/clawd/proofof-site/api')
import importlib
for m in list(sys.modules):
    if 'index' in m: del sys.modules[m]
i = importlib.import_module('index')

questions = [
    "What is defonos.io? Should I buy it?",
    "Help me predict which employees will quit",
]

for q in questions:
    print()
    print("=== Q:", q)
    q_words = set(q.lower().split())
    q_lower = q.lower()
    article_scores = []
    for article in i._SOV4_EU_ARTICLES:
        topic_words = set(article["topic"].lower().split())
        title_words = set(article["title"].lower().split())
        body_words = set(article["text"].lower().split())
        topic_score = len(q_words & topic_words) * 5
        title_score = len(q_words & title_words) * 3
        body_score = len(q_words & body_words)
        substring_bonus = sum(4 for w in q_words if len(w) > 3 and w in article["title"].lower())
        id_bonus = 0
        if article["id"] == "art_2" and ("face" in q_lower or "track" in q_lower or "surveil" in q_lower or "predict" in q_lower or "profile" in q_lower or "employees" in q_lower or "quit" in q_lower): id_bonus += 60
        elif article["id"] == "art_3" and ("aukus" in q_lower or "five-eyes" in q_lower): id_bonus += 50
        elif article["id"] == "art_4" and "defonos" in q_lower: id_bonus += 60
        total = topic_score + title_score + body_score + substring_bonus + id_bonus
        if total > 0:
            article_scores.append((total, article["id"], article["title"][:50]))
    article_scores.sort(key=lambda x: -x[0])
    for score, aid, title in article_scores[:5]:
        print("  %6.1f  %-20s %s" % (score, aid, title))
