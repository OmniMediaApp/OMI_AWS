import requests
import asyncio

async def get_refresh_token(auth_code, redirect_uri, client_id, client_secret):
    url = 'https://oauth2.googleapis.com/token'
    payload = {
        'code': auth_code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }

    try:
        response = requests.post(url, data=payload, headers=headers)
        response_data = response.json()
        print(response_data)

        if 'refresh_token' in response_data:
            return response_data['refresh_token']
        else:
            raise Exception('Refresh token not found in the response')

    except Exception as error:
        print('An error occurred:', error)
        return None
