import scrapy


class CricketSpider(scrapy.Spider):
    name = 'cricket_spider'
    start_urls = [
        'https://stats.espncricinfo.com/ci/engine/records/team/match_results.html?id=14450;type=tournament'
    ]

    def parse(self, response):
        # Parsing the initial page to extract players' links
        links = response.css('table.engineTable > tbody > tr.data1')
        for row in links:
            row_url = "https://www.espncricinfo.com" + row.css('td:nth-child(7) a::attr(href)').get()
            yield scrapy.Request(url=row_url, callback=self.parse_players_links)

    def parse_players_links(self, response):
        # Parsing individual player's page to collect bowling summary links
        links = []
        all_rows = response.css('table.engineTable > tbody > tr.data1')
        for row in all_rows:
            tds = row.css('td')
            row_url = "https://www.espncricinfo.com" + tds[6].css('a::attr(href)').get()
            links.append(row_url)

        yield {"playersLinks": links}

    def parse(self, response):
        # Parsing the player's page to collect bowling summary
        match = response.css('div:has(span > span > span:contains("Match Details")) + div')
        team1 = match.css('span > span > span::text').getall()[0].replace(" Innings", "")
        team2 = match.css('span > span > span::text').getall()[1].replace(" Innings", "")
        match_info = team1 + ' Vs ' + team2

        tables = response.css('div > table.ds-table')
        first_inning_rows = tables[1].css('tbody > tr').xpath('count(td) >= 11')

        second_inning_rows = tables[3].css('tbody > tr').xpath('count(td) >= 11')

        bowling_summary = []
        # Parsing bowling summary for the first innings
        for index, row in enumerate(first_inning_rows):
            tds = row.css('td')
            bowling_summary.append({
                "match": match_info,
                "bowlingTeam": team2,
                "bowlerName": tds[0].css('a > span::text').get().replace(' ', ''),
                "overs": tds[1].css('::text').get(),
                "maiden": tds[2].css('::text').get(),
                "runs": tds[3].css('::text').get(),
                "wickets": tds[4].css('::text').get(),
                "economy": tds[5].css('::text').get(),
                "0s": tds[6].css('::text').get(),
                "4s": tds[7].css('::text').get(),
                "6s": tds[8].css('::text').get(),
                "wides": tds[9].css('::text').get(),
                "noBalls": tds[10].css('::text').get()
            })

        # Parsing bowling summary for the second innings
        for index, row in enumerate(second_inning_rows):
            tds = row.css('td')
            bowling_summary.append({
                "match": match_info,
                "bowlingTeam": team1,
                "bowlerName": tds[0].css('a > span::text').get().replace(' ', ''),
                "overs": tds[1].css('::text').get(),
                "maiden": tds[2].css('::text').get(),
                "runs": tds[3].css('::text').get(),
                "wickets": tds[4].css('::text').get(),
                "economy": tds[5].css('::text').get(),
                "0s": tds[6].css('::text').get(),
                "4s": tds[7].css('::text').get(),
                "6s": tds[8].css('::text').get(),
                "wides": tds[9].css('::text').get(),
                "noBalls": tds[10].css('::text').get()
            })

        yield {"bowlingSummary": bowling_summary}
