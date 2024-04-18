from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
import datetime
import asyncio

# Function to get yesterday's spend for a specific customer
async def getGoogleSpend(customer_id, dateStart):
    # Configuration for the Google Ads API client
    config = {
        "client_id": "776354593059-bkuqml5u1nfrmfqlmhcdactisbupqqb4.apps.googleusercontent.com",
        "client_secret": "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",
        "developer_token": "RTeEbkzAQJZQRKOnOG4r4w",
        "refresh_token": "1//04reYZjt3NWI9CgYIARAAGAQSNwF-L9Irj8n3gq1JNF09AQQR9N0OFhuezUUUX-6-Lnt30QxoF247SOHiByUF0wO7_Rkr38ckN4U",
        "use_proto_plus": True,
    }

    try:
        # Initialize the Google Ads client
        google_ads_client = GoogleAdsClient.load_from_dict(config)

        # Get the GoogleAdsService
        google_ads_service = google_ads_client.get_service("GoogleAdsService")

        # GAQL QUERY FOR AD METRICS
        query = f"""
        SELECT
            customer.id,
            segments.date,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.conversions,
            metrics.cost_per_conversion,
            metrics.conversions_value,
            metrics.cost_micros
        FROM
            customer
        WHERE
            segments.date = '{dateStart}'
        """

        # Execute the query
        response = google_ads_service.search_stream(customer_id=customer_id, query=query)

        for batch in response:
            for row in batch.results:
                print(row)
                clicks = row.metrics.clicks if row.metrics.clicks else 0
                conversions = row.metrics.conversions if row.metrics.conversions else 0
                conversion_value = row.metrics.conversions_value if row.metrics.conversions_value else 0
                cost_micros = row.metrics.cost_micros if row.metrics.cost_micros else 0

                # Calculate the conversion rate
                conversion_rate = (conversions / clicks * 100) if clicks > 0 else 0
                
                # Calculate ROAS
                # Convert cost from micros to dollars
                ad_spend_dollars = cost_micros / 1_000_000
                roas = (conversion_value / ad_spend_dollars) if ad_spend_dollars > 0 else 0
                conversion_value_to_cost_ratio = conversion_value / ad_spend_dollars if ad_spend_dollars > 0 else 0


                metrics = {
                    'customer_id': row.customer.id,
                    'date': row.segments.date,
                    'impressions': row.metrics.impressions,
                    'clicks': row.metrics.clicks,
                    'ctr': row.metrics.ctr,
                    'conversions': row.metrics.conversions,
                    'conversions_rate': conversion_rate,
                    'cost_per_conversion': row.metrics.cost_per_conversion,
                    'conversion_value' : row.metrics.conversions_value,
                    'cost_micros': row.metrics.cost_micros,
                    # Convert cost from micros to dollars
                    'cost_dollars': ad_spend_dollars,
                    'ROAS': roas,
                    'conversion_value_to_cost_ratio' : conversion_value_to_cost_ratio
                }
                return metrics

    except GoogleAdsException as ex:
        print(f'Request with ID "{ex.request_id}" failed with status "{ex.error.code().name}" and includes the following errors:')
        for error in ex.failure.errors:
            print(f'\tError with message "{error.message}".')
            if error.location:
                for field_path_element in error.location.field_path_elements:
                    print(f'\t\tOn field: {field_path_element.field_name}')
    except Exception as ex:
        print('Unexpected error occurred:', ex)