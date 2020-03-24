## R script to automatically scrape table + geocode 
## ...because manually geocoding the number of cases is time consuming!!
## During the SAFRA outbreak, it was becoming totally tedious.
library(xml2)
library(rvest)
library(tidyverse)
library(httr)

## TODO: could reduce number of API geocode calls by only querying 'new cases' that appear 
## but will need to reference previous version of csv file

## get case table from wikipedia page!
getHTMLCaseTableWiki <- function() {
  print("BEGIN TABLE WEBSCRAPE...")
  url <- "https://en.wikipedia.org/wiki/Template:2019%E2%80%9320_coronavirus_outbreak_data/Singapore_medical_cases"
  
  webpage <- read_html(url)
  
  table <- html_nodes(webpage, ".wikitable")
  df <- as.data.frame(table %>% html_table(fill = TRUE))
  print("COMPLETE TABLE WEBSCAPE")
  return (df)
}

## organise table data into DF
organiseDFFromTable <- function(df) {
  print("BEGINNING TABLE TO DF PROCESS...")
  ## there probably is a more efficient way of doing all the regex ...
  new_df <- df %>%
    mutate(place_of_stay = gsub("^.* at ", "" ,Place.of.stay.Home.Travel.history),
           cluster_relation = ifelse(str_detect(Case.relation.notes.1., 
                                                "Related to cases at "), 
                                     gsub("^.*Related to cases at ",
                                          "", 
                                          Case.relation.notes.1.), 
                                     NA),
           IMPORTED = str_detect(Case.relation.notes.1., "Imported"),
           UNTRACED = str_detect(Case.relation.notes.1., "Untraced"),
           DISCHARGE_DATE = ifelse(str_detect(Outcome, "Discharged on"),
                               gsub("^.*Discharged on ", "", Outcome), NA),
           DEATH_DATE = ifelse(str_detect(Outcome, "Passed away on"),
                         gsub("Passed away on |,.*$", "", Outcome), NA)) %>% 
    mutate(place_of_stay = gsub("^.*Home in", "", place_of_stay),
           cluster_relation = gsub("Family member of.*", 
                                   "", 
                                   cluster_relation)) %>%
    mutate(place_of_stay = gsub(" area", 
                                "", 
                                place_of_stay),
           cluster_relation = gsub("Contact of case.*",
                                   "", 
                                   cluster_relation)) %>%
    slice(1:(n() - 1)) %>%
    mutate(place_of_stay = na_if(place_of_stay, "-")) %>%
    rename(CASE_NUMBER = Case,
           CONFIRMED_DATE = Date.announced,
           AGE = Age,
           GENDER = Gender,
           NATIONALITY = Nationality,
           CASE_RELATION_NOTES = `Case.relation.notes.1.`,
           PLACE_OF_STAY = place_of_stay,
           CLUSTER_LOCATION_NAME = cluster_relation,
           HOSPITAL_ADMITTED = Hospitals.visited,
           BEEN_TO_HIGHLY_AFFECTED_AREAS = Been.to.highly.affected.areas.notes.2.)
  print("PROCESSING NEW_DF COMPLETE.")
  return(new_df)
}


## test api query / test geocoding
testOneMapGeocodeAPI <- function() {
  test_query <- list(searchVal = "", returnGeom = "Y", getAddrDetails = "N", pageNum = "1")
  test_url <- "https://developers.onemap.sg/commonapi/search"
  test_res <- GET(test_url, query = test_query)
  test_results <- content(test_res)$results
  return(test_results)
}


## GET GEOCODE from address / place 
getGeoCode <- function(address) {
  ## convert address into capital letters, and anything after the comma
  upperAddress <- toupper(gsub(",.*", "", address))
  
  if (is.na(upperAddress)) return(c(upperAddress, lat = NA, long = NA))
  
  ## if address is from an evacuation plane from Wuhan, put default 
  ## as Changi Airport
  if (!is.na(upperAddress) && upperAddress == "EVACUATION PLANE FROM WUHAN") {
    upperAddress <- "CHANGI AIRPORT"
  }
  url <- "https://developers.onemap.sg/commonapi/search"
  
  query <- list(searchVal = upperAddress, 
                returnGeom = "Y", 
                getAddrDetails = "N", 
                pageNum = "1")
  res <- GET(url, query = query)
  results <- content(res)$results
  ## if results are blank 
  if (length(results) == 0) return(c(upperAddress, lat = NA, long = NA))
  
  lat <- results[[1]]$LATITUDE
  long <- results[[1]]$LONGITUDE
  
  return(c(upperAddress, lat, long))
}

## get geocodes for each case's place of stay
getPOSGeocodes <- function(new_df) {
  print("BEGINNING POS GEOCODING...")
  pos <- new_df$PLACE_OF_STAY
  geoList <- sapply(pos, getGeoCode)
  
  ## put them together into 1 DF
  geo_pos_df <- as.tibble(t(geoList)) %>% 
    rename(POS_address_query = V1, 
           POS_LOCATION_LAT = V2, 
           POS_LOCATION_LONG = V3) %>%
    mutate(CASE_NUMBER = as.character(1:n()))
  
  print("RETURNING GEO_POS_DF")
  return(geo_pos_df)
}

## get cluster geocodes 
getClusterGeocodes <- function(new_df) {

  ## cluster locations that can't be found from API
  # otherClusterLocations = c("Yong Thai Hang", "The Life Church and Missions Singapore", 
  #                           "the Grace Assembly of God churches",
  #                           "Wizlearn Technologies Pte Ltd", "boulder+ Gym")
  
  # otherClusterLocationAddresses = c("24 CAVAN ROAD", "146B PAYA LEBAR ROAD", "355 TANGLIN ROAD", 
  # "10 SCIENCE PARK ROAD", "12 KALLANG AVE")

  # otherClusterList <- sapply(otherClusterLocationAddresses, getGeoCode)
  # print(otherClusterList)
  # print(as.tibble(t(otherClusterList)))
  
  # other_clusters_df <- as.tibble(t(otherClusterList)) %>%
  #                      rename(CLUSTER_address_query = V1, 
  #                             CLUSTER_LOCATION_LAT = V2, 
  #                             CLUSTER_LOCATION_LONG = V3) %>%
  #                      mutate(CLUSTER_LOCATION_NAME = otherClusterLocations)
  
  # print(other_clusters_df)


  ## determine cluster locations 
    print("BEGINNING CLUSTER GEOCODING...")
  clusterLocations <- new_df$CLUSTER_LOCATION_NAME
  geoClusterList <- sapply(clusterLocations, getGeoCode)
  
  geo_cluster_df <- as.tibble(t(geoClusterList)) %>%
    rename(CLUSTER_address_query = V1, 
           CLUSTER_LOCATION_LAT = lat, 
           CLUSTER_LOCATION_LONG = long) %>%
    mutate(CASE_NUMBER = as.character(1:n()),
           CLUSTER_LOCATION_ID = ifelse(is.na(CLUSTER_LOCATION_LAT), 
                                        NA, 
                                        group_indices(., 
                                                      CLUSTER_LOCATION_LAT,
                                                      CLUSTER_LOCATION_LONG)))
    
  print("RETURNING GEO_CLUSTER_DF")
  return(geo_cluster_df)
}



## create function for running ALL this 
generateCSV <- function() {
  df <- getHTMLCaseTableWiki()
  new_df <- organiseDFFromTable(df)
  geo_pos_df <- getPOSGeocodes(new_df)
  geo_cluster_df <- getClusterGeocodes(new_df)
  
  ## merge the dfs together
  joined_df <- new_df %>% full_join(geo_pos_df, by = "CASE_NUMBER") %>% 
    full_join(geo_cluster_df, by = "CASE_NUMBER")
  
  write.csv(joined_df, "src/data/covid-2019-automated.csv")
  print("DATA SCRAPING PROCESS COMPLETE.")
}

## run!
generateCSV()


