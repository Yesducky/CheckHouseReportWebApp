import json
from models import db, House
from app import app

with open('prh-estates.json', 'r', encoding='utf-8') as file:
    prh_estates = json.load(file)

with app.app_context():
    for estate in prh_estates:
        name = estate["Estate Name"]["zh-Hant"]
        # Only add if not exists
        if not House.query.filter_by(name=name).first():
            house = House(name=name, can_buy=True)
            db.session.add(house)
    db.session.commit()
    print("All estates written to house table.")
