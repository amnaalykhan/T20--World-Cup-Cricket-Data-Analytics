import scrapy


class CricketSpider(scrapy.Spider):
    name = 'cricket_spider'
    start_urls = [
        'https://stats.espncricinfo.com/ci/engine/records/team/match_results.html?id=14450;type=tournament'
    ]

    def parse(self, response):
        # Parsing the initial page to extract match summary links
        links = response.css('table.engineTable > tbody > tr.data1')
        for row in links:
            row_url = "https://www.espncricinfo.com" + row.css('td:nth-child(7) a::attr(href)').get()
            yield scrapy.Request(url=row_url, callback=self.parse_match_summary)

    def parse_match_summary(self, response):
        # Parsing individual match summary page
        match = response.css('div:has(span > span > span:contains("Match Details")) + div')
        team1 = match.css('span > span > span::text').getall()[0].replace(" Innings", "")
        team2 = match.css('span > span > span::text').getall()[1].replace(" Innings", "")
        match_info = team1 + ' Vs ' + team2

        tables = response.css('div > table.ci-scorecard-table')
        first_innings_rows = tables[0].css('tbody > tr').xpath('count(td) >= 8')

        second_innings_rows = tables[1].css('tbody > tr').xpath('count(td) >= 8')

        batting_summary = []
        # Parsing batting summary for the first innings
        for index, row in enumerate(first_innings_rows):
            tds = row.css('td')
            batting_summary.append({
                "match": match_info,
                "teamInnings": team1,
                "battingPos": index + 1,
                "batsmanName": tds[0].css('a > span > span::text').get().replace(' ', ''),
                "dismissal": tds[1].css('span > span::text').get(),
                "runs": tds[2].css('strong::text').get(),
                "balls": tds[3].css('::text').get(),
                "4s": tds[5].css('::text').get(),
                "6s": tds[6].css('::text').get(),
                "SR": tds[7].css('::text').get()
            })

        # Parsing batting summary for the second innings
        for index, row in enumerate(second_innings_rows):
            tds = row.css('td')
            batting_summary.append({
                "match": match_info,
                "teamInnings": team2,
                "battingPos": index + 1,
                "batsmanName": tds[0].css('a > span > span::text').get().replace(' ', ''),
                "dismissal": tds[1].css('span > span::text').get(),
                "runs": tds[2].css('strong::text').get(),
                "balls": tds[3].css('::text').get(),
                "4s": tds[5].css('::text').get(),
                "6s": tds[6].css('::text').get(),
                "SR": tds[7].css('::text').get()
            })

        yield {"battingSummary": batting_summary}
