from flask import Flask, request, jsonify
from flask_cors import CORS
from getGoogleAccounts import getGoogleAccounts
from getGoogleSpendHourly import getGoogleSpendHourly
from getGoogleSpend import getGoogleSpend
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore_async
<<<<<<< Updated upstream
from dotenv import load_dotenv

load_dotenv()
=======

>>>>>>> Stashed changes

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
<<<<<<< Updated upstream

db = firestore_async.client()
=======
>>>>>>> Stashed changes
@app.route("/api")
def index1():
    return "Success"

@app.route("/api/getGoogleAccounts", methods=['POST'])
async def index2():
    try:

        data = request.json
        businessID = data.get('businessID')
        print(businessID)
        result = await getGoogleAccounts(db, businessID)
        print(result)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/api/getGoogleSpend", methods=['POST'])
async def index3():
    try:
        data = request.json
        start_date = data.get('start_date')
        customer_id = data.get('customer_id')
        result = await getGoogleSpend(db, customer_id, start_date)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/api/getGoogleSpendHourly", methods=['POST'])
async def index4():
    try:
        data = request.json
        start_date = data.get('start_date')
        customer_id = data.get('customer_id')
        result = await getGoogleSpendHourly(db, customer_id, start_date)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=3002)
