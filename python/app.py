from flask import Flask, request, jsonify
from flask_cors import CORS
from getGoogleAccounts import getGoogleAccounts
from getGoogleSpendHourly import getGoogleSpendHourly
from getGoogleSpend import getGoogleSpend
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/api")
def index1():
    return "Success"

@app.route("/api/getGoogleAccounts", methods=['GET'])
async def index2():
    try:
        result = await getGoogleAccounts()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/api/getGoogleSpend", methods=['POST'])
async def index3():
    try:
        data = request.json
        start_date = data.get('start_date')
        customer_id = data.get('customer_id')
        result = await getGoogleSpend(customer_id, start_date)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/api/getGoogleSpendHourly", methods=['POST'])
async def index4():
    try:
        data = request.json
        start_date = data.get('start_date')
        customer_id = data.get('customer_id')
        result = await getGoogleSpendHourly(customer_id, start_date)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=3001)
