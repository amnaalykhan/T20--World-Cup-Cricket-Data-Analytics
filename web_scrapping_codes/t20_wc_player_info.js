import scrapy

class CricketSpider(scrapy.Spider):
    name = 'cricket'

    # -------------- STAGE 1 ------------

    def start_requests(self):
        url = 'https://stats.espncricinfo.com/ci/engine/records/team/match_results.html?id=14450;type=tournament'
        yield scrapy.Request(url=url, callback=self.parse_match_summary_links)

    def parse_match_summary_links(self, response):
        # Step 1: Create a list to store match summary links
        matchSummaryLinks = []

        # Step 2: Selecting all rows from the target table
        allRows = response.css('table.engineTable > tbody > tr.data1')

        # Step 3: Loop through each row and extract the URL
        for row in allRows:
            rowURL = response.urljoin(row.css('td:nth-child(7) a::attr(href)').get())
            matchSummaryLinks.append(rowURL)

            # Step 4: Yield a request for the match summary page
            yield scrapy.Request(url=rowURL, callback=self.parse_players_data)

        # Step 5: Return the match summary links
        yield {
            'matchSummaryLinks': matchSummaryLinks
        }


    # ------------ STAGE 2 --------------

    def parse_players_data(self, response):
        # Step 1: Extract team names
        team1 = response.css('div:contains("Match Details") span:nth-child(1)::text').get().replace(" Innings", "")
        team2 = response.css('div:contains("Match Details") span:nth-child(2)::text').get().replace(" Innings", "")

        # Step 2: Extract batting players' data
        battingPlayers = response.css('div > table.ci-scorecard-table:nth-child(1) tbody tr:has(td:nth-child(8))')
        playersData = []
        for player in battingPlayers:
            name = player.css('td:nth-child(1) a span span::text').get().replace(' ', '')
            link = response.urljoin(player.css('td:nth-child(1) a::attr(href)').get())
            playersData.append({
                'name': name,
                'team': team1,
                'link': link
            })

        # Step 3: Extract bowling players' data
        bowlingPlayers = response.css('div > table.ds-table:nth-child(2) tbody tr:has(td:nth-child(11))')
        for player in bowlingPlayers:
            name = player.css('td:nth-child(1) a span::text').get().replace(' ', '')
            link = response.urljoin(player.css('td:nth-child(1) a::attr(href)').get())
            playersData.append({
                'name': name,
                'team': team2,
                'link': link
            })

        # Step 4: Yield requests for player details
        for player in playersData:
            yield scrapy.Request(url=player['link'], callback=self.parse_player_details, meta=player)

    def parse_player_details(self, response):
        # Step 5: Extract player details
        name = response.meta['name']
        team = response.meta['team']
        battingStyle = response.css('div:contains("Batting Style") span::text').get()
        bowlingStyle = response.css('div:contains("Bowling Style") span::text').get()
        playingRole = response.css('div:contains("Playing Role") span::text').get()
        description = response.css('div.ci-player-bio-content p::text').get()

        # Step 6: Return the player details
        yield {
            'name': name,
            'team': team,
            'battingStyle': battingStyle,
            'bowlingStyle': bowlingStyle,
            'playingRole': playingRole,
            'description': description
        }


# Run the spider
if __name__ == '__main__':
    from scrapy.crawler import CrawlerProcess

    process = CrawlerProcess()
    process.crawl(CricketSpider)
    process.start()
