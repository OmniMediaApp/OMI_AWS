import datetime
import asyncio
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

async def getGoogleSpendHourly(db, customer_id, dateStart):
    
    
    config = {
        "client_id": "776354593059-bkuqml5u1nfrmfqlmhcdactisbupqqb4.apps.googleusercontent.com",  # your client ID
        "client_secret": "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",  # your client secret
        "developer_token": "RTeEbkzAQJZQRKOnOG4r4w",  # your developer token
        "refresh_token": "1//04reYZjt3NWI9CgYIARAAGAQSNwF-L9Irj8n3gq1JNF09AQQR9N0OFhuezUUUX-6-Lnt30QxoF247SOHiByUF0wO7_Rkr38ckN4U",  # your refresh token
        "use_proto_plus": True,
    }

    try:
        google_ads_client = GoogleAdsClient.load_from_dict(config)
        print("Google Ads Client initialized successfully")

        google_ads_service = google_ads_client.get_service("GoogleAdsService")

        query = f"""
        SELECT
            segments.date,
            segments.hour,
            metrics.cost_micros
        FROM
            customer
        WHERE
            segments.date = '{dateStart}'
        ORDER BY
            segments.hour
        """
        print(f"Executing query: {query}")

        response = google_ads_service.search_stream(customer_id=customer_id, query=query)
        hourly_spend_data = []

        for batch in response:
            if batch.results:
                for row in batch.results:
                    cost_micros = row.metrics.cost_micros if row.metrics.cost_micros else 0
                    ad_spend_dollars = cost_micros / 1_000_000

                    hourly_data = {
                        'date': row.segments.date,
                        'hour': row.segments.hour,
                        'cost_dollars': ad_spend_dollars
                    }

                    hourly_spend_data.append(hourly_data)
            else:
                print("No data returned for the batch")

        return hourly_spend_data

    except GoogleAdsException as ex:
        print(f'Request with ID "{ex.request_id}" failed with status "{ex.error.code().name}" and includes the following errors:')
        for error in ex.failure.errors:
            print(f'\tError with message "{error.message}".')
            if error.location:
                for field_path_element in error.location.field_path_elements:
                    print(f'\t\tOn field: {field_path_element.field_name}')
    except Exception as ex:
        print('Unexpected error occurred:', ex)

# Usage example
# asyncio.run(getGoogleSpendHourly('123-456-7890', '2023-01-01'))
