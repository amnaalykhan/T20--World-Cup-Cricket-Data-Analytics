import scrapy


class CricketSpider(scrapy.Spider):
    name = 'cricket_spider'
    start_urls = [
        'https://stats.espncricinfo.com/ci/engine/records/team/match_results.html?id=14450;type=tournament'
    ]

    def parse(self, response):
        # Parsing the page to collect match summary
        match_summary = []
        all_rows = response.css('table.engineTable > tbody > tr.data1')
        for row in all_rows:
            tds = row.css('td')
            match_summary.append({
                "team1": tds[0].css('::text').get(),
                "team2": tds[1].css('::text').get(),
                "winner": tds[2].css('::text').get(),
                "margin": tds[3].css('::text').get(),
                "ground": tds[4].css('::text').get(),
                "matchDate": tds[5].css('::text').get(),
                "scorecard": tds[6].css('::text').get()
            })

        yield {"matchSummary": match_summary}
